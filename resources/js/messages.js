import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000';

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null; // Unused in messages.js, can be removed
let availableStudents = [];
let selectedParticipants = new Set(); // Unused in messages.js, can be removed
let unreadMessages = [];

// NEW: Flag and container for managing data dependencies
let allStudentsReceived = false;
let pendingUnreadMessages = []; // To store messages received before students are ready

const currentUser = {
    mysqlUserId: window.chatConfig.studentId,
    loginName: window.chatConfig.loginName,
    name: window.chatConfig.studentName,
    lastname: window.chatConfig.studentLastname
};

// --- Socket Handlers ---

socket.on('connect', () => {
    console.log('Connected to chat server from messages.js!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,
        lastname: currentUser.lastname
    });
    // Request all students when connected, needed for getDisplayName
    socket.emit('requestAllUsers'); // Use 'requestAllUsers' as per chat.js and server.js
    socket.emit('getUnreadMessages', currentUser.mysqlUserId); // Request unread messages
});

socket.on('disconnect', () => {
    console.log('Disconnected from chat server (messages.js).');
});

socket.on('newNotification', (notification) => {
    console.log('Notification received (messages.js):', notification);

    const plane = document.querySelector('.plane-icon');
    if (plane) {
        plane.classList.add('animate');
    }
    const notificationCircle = document.getElementById('notification-circle');
    if (notificationCircle) {
        notificationCircle.style.opacity = 1;
    }
    const notificationsContainer = document.querySelector('.notifications');
    if (notificationsContainer) {
        notificationsContainer.classList.add('no-hover');
    }

    setTimeout(() => {
        if (plane) {
            plane.classList.remove('animate');
        }
    }, 500);

    setTimeout(() => {
        if (notificationsContainer) {
            notificationsContainer.classList.remove('no-hover');
        }
    }, 750);

    // After a new notification, re-fetch unread messages to update the dropdown
    socket.emit('getUnreadMessages', currentUser.mysqlUserId);
});

// NEW: Changed from 'allStudents' to 'allUsersList' for consistency with chat.js/server.js
socket.on('allUsersList', (users) => {
    // Populate availableStudents with full user data
    availableStudents = users;
    allStudentsReceived = true;
    console.log("All users loaded and availableStudents populated in messages.js:", availableStudents);

    // If unread messages were received before users, process them now
    if (pendingUnreadMessages.length > 0) {
        console.log("Processing pending unread messages with updated user data.");
        processUnreadMessages(pendingUnreadMessages);
        pendingUnreadMessages = []; // Clear pending messages
    }
});

socket.on('userStatusUpdate', (data) => {
    console.log('User status update (messages.js):', data);
    // This part might be relevant if you display user status within the notification dropdown.
    // If not, you can remove this handler from messages.js for simplicity.
    const userElement = document.querySelector(`.user-list-item[data-user-id="${data.mysqlUserId}"]`);
    if (userElement) {
        userElement.classList.remove('online', 'offline');
        userElement.classList.add(data.status);
    }
});


// COMBINED and REVISED socket.on('unreadMessages')
socket.on('unreadMessages', (messages) => {
    console.log('[Client Messages.js] Received unreadMessages:', messages);
    console.log('[Client Messages.js] Dropdown element:', document.querySelector('.notifications .dropdown'));

    if (!allStudentsReceived) {
        // If all students haven't been received yet, store messages and wait
        pendingUnreadMessages = messages;
        console.log("Unread messages received before all users, storing them.");
        return;
    }

    processUnreadMessages(messages);
});

// NEW: Function to encapsulate processing unread messages
function processUnreadMessages(messages) {
    unreadMessages = messages.map(msg => ({
        chatId: msg.chatId,
        user: getDisplayName(msg.senderId),
        text: msg.message
    }));
    updateUnreadDropdown();

    // Update notification circle opacity based on message count
    const notificationCircle = document.getElementById('notification-circle');
    if (notificationCircle) {
        notificationCircle.style.opacity = messages.length > 0 ? 1 : 0;
    }
}


// --- Utility Functions ---

function getDisplayName(userId) {
    if (userId === currentUser.mysqlUserId) return 'You';

    // Ensure availableStudents is populated before attempting to find
    if (availableStudents.length === 0) {
        console.warn(`getDisplayName: availableStudents is empty when looking for user ID: ${userId}.`);
        return `User ${userId}`; // Fallback
    }

    const user = availableStudents.find(s => s.mysqlUserId == userId);

    if (user) {
        if (user.name && user.lastname) {
            return `${user.name} ${user.lastname}`;
        }
        if (user.loginName) {
            return user.loginName;
        }
    }
    return `User ${userId}`; // Fallback if user not found or incomplete data
}

function renderMessageComponent(msg) {
    return `
        <div class="message" data-chat-id="${msg.chatId}">
            <div class="message-content">
                <span class="user-name">${msg.user}</span>
                <p class="message-text">${msg.text}</p>
            </div>
        </div>
    `;
}

function updateUnreadDropdown() {
    const dropdown = document.querySelector('.notifications .dropdown');
    if (!dropdown) {
        console.error('Dropdown element not found!');
        return;
    }

    if (unreadMessages.length === 0) {
        dropdown.innerHTML = '<div class="no-messages">No unread messages</div>';
    } else {
        const messagesHtml = unreadMessages.map(renderMessageComponent).join('');
        dropdown.innerHTML = `
            ${messagesHtml}
            <div class="dropdown-footer">
                <button id="markAllReadBtn" class="mark-all-read-button">Mark All as Read</button>
            </div>
        `;
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', markAllUnreadAsRead);
        }

        dropdown.querySelectorAll('.message').forEach(messageDiv => {
            messageDiv.addEventListener('click', (event) => {
                const clickedChatId = messageDiv.dataset.chatId;
                if (clickedChatId) {
                    // Navigate to the chat page with the chat ID in the URL
                    window.location.href = `/messages?chatId=${clickedChatId}`;
                }
            });
        });
    }
}

function markAllUnreadAsRead() {
    const uniqueChatIds = [...new Set(unreadMessages.map(msg => msg.chatId))];

    uniqueChatIds.forEach(chatId => {
        socket.emit('markMessagesAsRead', {
            chatId: chatId,
            userId: currentUser.mysqlUserId
        });
    });

    unreadMessages = []; // Clear local unread messages
    updateUnreadDropdown(); // Update the UI to show no messages
    const notificationCircle = document.getElementById('notification-circle');
    if (notificationCircle) {
        notificationCircle.style.opacity = 0;
    }
}

// --- DOM Content Loaded Listener ---

document.addEventListener('DOMContentLoaded', () => {
    const notificationsIcon = document.querySelector('.notificationsIcon');
    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', () => {
            // This button navigates to the messages page (where chat.js loads)
            // It also clears the notification circle if clicked
            const notificationCircle = document.getElementById('notification-circle');
            if (notificationCircle) {
                notificationCircle.style.opacity = 0;
            }
            window.location.href = '/messages';
        });
    } else {
        console.error("Element with class 'notificationsIcon' not found.");
    }

    // On initial load, request unread messages
    // This is already done in socket.on('connect'), so this might be redundant,
    // but keeping it here for safety to ensure request is sent on page load.
    socket.emit('getUnreadMessages', currentUser.mysqlUserId);
});