// Initialize the dashboard by loading data dynamically

// Load Profile Overview data
function loadProfileOverview() {
    const profileOverview = document.getElementById('profile-overview');
    profileOverview.innerHTML = `
        <p><strong>Name:</strong> Kareem Abukhadra</p>
        <p><strong>Interests:</strong> Hiking, Cooking, Technology</p>
        <p><strong>Preferred Matches:</strong> Coffee lovers, adventurous personalities</p>
        <p><strong>Recent Activity:</strong> Connected with 5 new matches this week</p>
    `;
}

// Load Messaging Insights
function loadMessagingInsights() {
    const insightsContainer = document.getElementById('messaging-insights');
    insightsContainer.innerHTML = `
        <ul>
            <li>Successful Opener: "You're super hot. Let's grab coffee!"</li>
            <li>Top Response Rate: 70% for direct compliments</li>
            <li>Common Topics: Fitness, Career, Lifestyle</li>
            <li>Suggested Topics: Travel, Favorite books</li>
        </ul>
    `;
}

// Generate Opener
async function generateOpener() {
    const context = document.getElementById('situation').value;
    const style = document.getElementById('style').value;
    try {
        const response = await fetch('/generate-opener', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ context, style })
        });
        const data = await response.json();
        document.getElementById('opener-result').innerHTML = `<p>${data.opener}</p>`;
    } catch (error) {
        console.error('Error generating opener:', error);
        document.getElementById('opener-result').innerText = "Failed to generate opener. Please try again.";
    }
}

// Load Notifications
function loadNotifications() {
    const notificationsContainer = document.getElementById('notifications');
    notificationsContainer.innerHTML = `
        <ul>
            <li><strong>New Match:</strong> Olivia, who also enjoys cooking and hiking.</li>
            <li><strong>Message Reminder:</strong> Don't forget to reply to Sarah!</li>
            <li><strong>Activity Alert:</strong> Maya viewed your profile 3 times today.</li>
        </ul>
    `;
}

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    loadProfileOverview();
    loadMessagingInsights();
    loadNotifications();
});