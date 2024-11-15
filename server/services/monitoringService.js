import AWS from 'aws-sdk';
import winston from 'winston';
import { createNamespace } from 'cls-hooked';
import { v4 as uuidv4 } from 'uuid';

const requestContext = createNamespace('request-context');

class MonitoringService {
    constructor() {
        this.cloudwatch = new AWS.CloudWatch({
            region: process.env.AWS_REGION,
            apiVersion: '2010-08-01'
        });

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ 
                    filename: 'logs/error.log', 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: 'logs/combined.log' 
                })
            ]
        });

        this.metrics = {
            requestCount: 0,
            errorCount: 0,
            totalLatency: 0
        };

        // Reset metrics every minute
        setInterval(() => this.publishMetrics(), 60000);
    }

    middleware() {
        return (req, res, next) => {
            const requestId = uuidv4();
            const startTime = Date.now();

            requestContext.run(() => {
                requestContext.set('requestId', requestId);
                requestContext.set('startTime', startTime);

                // Log request
                this.logger.info('Request received', {
                    requestId,
                    method: req.method,
                    url: req.url,
                    userAgent: req.get('user-agent')
                });

                // Track response
                res.on('finish', () => {
                    const duration = Date.now() - startTime;
                    this.recordMetrics(res.statusCode, duration);
                    
                    this.logger.info('Request completed', {
                        requestId,
                        statusCode: res.statusCode,
                        duration
                    });
                });

                next();
            });
        };
    }

    recordMetrics(statusCode, duration) {
        this.metrics.requestCount++;
        this.metrics.totalLatency += duration;
        
        if (statusCode >= 400) {
            this.metrics.errorCount++;
        }

        // Send critical errors to CloudWatch immediately
        if (statusCode >= 500) {
            this.sendAlertMetric('CriticalError', 1);
        }
    }

    async publishMetrics() {
        const timestamp = new Date();
        const metrics = [
            {
                MetricName: 'RequestCount',
                Value: this.metrics.requestCount,
                Unit: 'Count'
            },
            {
                MetricName: 'ErrorRate',
                Value: this.metrics.requestCount > 0 
                    ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
                    : 0,
                Unit: 'Percent'
            },
            {
                MetricName: 'AverageLatency',
                Value: this.metrics.requestCount > 0 
                    ? this.metrics.totalLatency / this.metrics.requestCount 
                    : 0,
                Unit: 'Milliseconds'
            }
        ];

        try {
            await this.cloudwatch.putMetricData({
                Namespace: `DatingAssistant-${process.env.NODE_ENV}`,
                MetricData: metrics.map(metric => ({
                    ...metric,
                    Timestamp: timestamp,
                    Dimensions: [
                        {
                            Name: 'Environment',
                            Value: process.env.NODE_ENV
                        }
                    ]
                }))
            }).promise();

            // Reset metrics after publishing
            this.resetMetrics();
        } catch (error) {
            this.logger.error('Failed to publish metrics', { error });
        }
    }

    async sendAlertMetric(name, value) {
        try {
            await this.cloudwatch.putMetricData({
                Namespace: `DatingAssistant-${process.env.NODE_ENV}-Alerts`,
                MetricData: [{
                    MetricName: name,
                    Value: value,
                    Timestamp: new Date(),
                    Unit: 'Count',
                    Dimensions: [
                        {
                            Name: 'Environment',
                            Value: process.env.NODE_ENV
                        }
                    ]
                }]
            }).promise();
        } catch (error) {
            this.logger.error('Failed to send alert metric', { error });
        }
    }

    resetMetrics() {
        this.metrics = {
            requestCount: 0,
            errorCount: 0,
            totalLatency: 0
        };
    }

    async monitorMLService() {
        try {
            const response = await fetch(process.env.ML_MODEL_ENDPOINT + '/health');
            const data = await response.json();

            await this.cloudwatch.putMetricData({
                Namespace: `DatingAssistant-${process.env.NODE_ENV}-ML`,
                MetricData: [{
                    MetricName: 'MLServiceHealth',
                    Value: data.status === 'healthy' ? 1 : 0,
                    Unit: 'Count',
                    Timestamp: new Date()
                }]
            }).promise();

            if (data.status !== 'healthy') {
                this.sendAlert('ML Service Unhealthy', 'critical');
            }
        } catch (error) {
            this.logger.error('ML Service monitoring failed', { error });
            this.sendAlert('ML Service Monitoring Failed', 'critical');
        }
    }

    async sendAlert(message, severity) {
        const sns = new AWS.SNS();
        const topicArn = process.env[`SNS_TOPIC_${severity.toUpperCase()}`];

        if (!topicArn) {
            this.logger.error('SNS topic not configured for severity', { severity });
            return;
        }

        try {
            await sns.publish({
                TopicArn: topicArn,
                Subject: `Dating Assistant Alert - ${severity.toUpperCase()}`,
                Message: JSON.stringify({
                    message,
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV,
                    severity
                })
            }).promise();
        } catch (error) {
            this.logger.error('Failed to send SNS alert', { error });
        }
    }
}

export default new MonitoringService(); 