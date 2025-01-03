import { 
    getFirestore, 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot,
    where,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();
let notificationsUnsubscribe = null;

// Store notifications in memory
let currentNotifications = [];

// Function to subscribe to notifications
export async function subscribeToNotifications() {
    try {
        // Clean up existing subscription
        if (notificationsUnsubscribe) {
            notificationsUnsubscribe();
        }

        // First, get initial unread messages
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('read', '==', false),
            orderBy('createdAt', 'desc')
        );

        // Set up real-time listener
        notificationsUnsubscribe = onSnapshot(q, (snapshot) => {
            console.log('Notifications snapshot:', snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
            
            // Group notifications by email
            const groupedNotifications = {};
            
            snapshot.docs.forEach(doc => {
                const notification = {
                    id: doc.id,
                    ...doc.data()
                };
                console.log('Processing notification:', notification);
                
                // Skip if no email or createdAt
                if (!notification.email || !notification.createdAt) {
                    console.log('Skipping notification - missing email or createdAt:', notification);
                    return;
                }
                
                if (!groupedNotifications[notification.email]) {
                    groupedNotifications[notification.email] = {
                        count: 1,
                        latest: notification,
                        messages: [notification]
                    };
                } else {
                    groupedNotifications[notification.email].count++;
                    groupedNotifications[notification.email].messages.push(notification);
                    if (notification.createdAt > groupedNotifications[notification.email].latest.createdAt) {
                        groupedNotifications[notification.email].latest = notification;
                    }
                }
            });

            console.log('Grouped notifications:', groupedNotifications);

            // Convert grouped notifications to array and sort by latest message
            currentNotifications = Object.values(groupedNotifications)
                .sort((a, b) => b.latest.createdAt - a.latest.createdAt)
                .slice(0, 5); // Keep only 5 most recent conversations
            
            console.log('Final notifications:', currentNotifications);
            
            // Update UI
            updateNotificationBadge();
            updateNotificationDropdown();
        }, (error) => {
            console.error('Error in notifications subscription:', error);
        });

        return notificationsUnsubscribe;
    } catch (error) {
        console.error('Error setting up notifications subscription:', error);
    }
}

// Function to format time
function formatNotificationTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

// Function to update notification badge
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;

    const totalCount = currentNotifications.reduce((sum, group) => sum + group.count, 0);
    
    if (totalCount > 0) {
        badge.textContent = totalCount > 99 ? '99+' : totalCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Function to get random empty notification message
function getRandomEmptyMessage() {
    const messages = [
        { emoji: '🦗', text: 'Crickets chirping... No messages yet!' },
        { emoji: '🌵', text: 'It\'s quiet here... Desert quiet!' },
        { emoji: '🕊️', text: 'Your inbox is as peaceful as a dove' },
        { emoji: '📭', text: 'Your inbox is taking a power nap' },
        { emoji: '🎵', text: 'No messages, no problems!' },
        { emoji: '🐢', text: 'Slower than a turtle... No messages today' },
        { emoji: '🌚', text: 'Dark side of the moon... No messages found' },
        { emoji: '🧘', text: 'Zen mode: Zero notifications' },
        { emoji: '🎪', text: 'Empty circus... No messages to show' },
        { emoji: '🌴', text: 'Vacation mode: Inbox is empty!' }
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Function to update notification dropdown
function updateNotificationDropdown() {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    if (!currentNotifications || currentNotifications.length === 0) {
        const emptyMessage = getRandomEmptyMessage();
        notificationList.innerHTML = `
            <div class="notification-empty">
                <div class="empty-emoji bounce">${emptyMessage.emoji}</div>
                <p class="empty-text fade-in">${emptyMessage.text}</p>
            </div>
        `;
        return;
    }

    // Get all notifications sorted by date
    const sortedNotifications = [...currentNotifications].sort((a, b) => 
        new Date(b.latest.createdAt) - new Date(a.latest.createdAt)
    );

    // Filter out viewed notifications and get next unviewed ones
    const unviewedNotifications = sortedNotifications.filter(group => !group.latest.read);
    
    // Take max 5 unviewed notifications
    const notificationsToShow = unviewedNotifications.slice(0, 5);

    notificationList.innerHTML = notificationsToShow.map(group => `
        <div class="notification-item unread" onclick="showMessages('${group.latest.email}')">
            <div class="notification-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header-line">
                    <span class="notification-name">${group.latest.name.split(' ')[0]}</span>
                    <span class="notification-time">${formatNotificationTime(group.latest.createdAt)}</span>
                </div>
                <div class="notification-message">
                    ${group.count > 1 
                        ? `Sent you ${group.count} messages` 
                        : group.latest.message.substring(0, 50) + (group.latest.message.length > 50 ? '...' : '')}
                </div>
            </div>
        </div>
    `).join('');
}

// Function to toggle notification dropdown
export function toggleNotificationDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const dropdown = document.querySelector('.notification-dropdown');
    if (!dropdown) return;

    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
}

// Function to mark all notifications as read
export async function markAllNotificationsAsRead() {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('read', '==', false));
        const snapshot = await getDocs(q);
        
        const updatePromises = snapshot.docs.map(doc => 
            updateDoc(doc.ref, {
                read: true,
                readAt: serverTimestamp()
            })
        );
        
        await Promise.all(updatePromises);
        
        // Close dropdown after marking all as read
        document.querySelector('.notification-dropdown').style.display = 'none';
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Function to show messages from a specific sender
export function showMessages(email) {
    // Hide notification dropdown
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Show messages section
    const messagesButton = document.querySelector('button[onclick="showSection(\'messages\')"]');
    if (messagesButton) {
        messagesButton.click();
    }
    
    // Find and click the message thread
    setTimeout(() => {
        const messageThread = document.querySelector(`[data-email="${email}"]`);
        if (messageThread) {
            messageThread.click();
        }
    }, 100);
}

// Function to view all notifications
export function viewAllNotifications() {
    // Hide notification dropdown
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Show messages section
    const messagesButton = document.querySelector('button[onclick="showSection(\'messages\')"]');
    if (messagesButton) {
        messagesButton.click();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    const dropdown = document.querySelector('.notification-dropdown');
    const notificationBtn = document.getElementById('notificationBtn');
    
    if (dropdown && notificationBtn && !dropdown.contains(event.target) && !notificationBtn.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Initialize notification system
document.addEventListener('DOMContentLoaded', () => {
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotificationDropdown);
    }
});

// Add functions to window object for HTML onclick access
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.viewAllNotifications = viewAllNotifications;
window.showMessages = showMessages; 