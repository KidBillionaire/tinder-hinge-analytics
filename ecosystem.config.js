module.exports = {
    apps: [
        {
            name: 'dating-assistant-staging',
            script: 'server/index.js',
            env: {
                NODE_ENV: 'staging',
                PORT: 4000,
                HTTPS_PORT: 4443
            },
            instances: 2,
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '1G',
            error_file: 'logs/staging-error.log',
            out_file: 'logs/staging-out.log',
            merge_logs: true,
            time: true
        }
    ]
}; 