// client-side: message.js

import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000'; // Make sure this matches your server's URL

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null;
let availableStudents = []; // This array holds the user data needed for display names
let selectedParticipants = new Set();
let unreadMessages = []; // This will store the unread messages for the dropdown


const currentUser = {
    mysqlUserId: window.chatConfig.studentId,
    loginName: window.chatConfig.loginName,
    name: window.chatConfig.studentName,
    lastname: window.chatConfig.studentLastname
};

// --- Socket.IO Event Listeners ---

socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,
        lastname: currentUser.lastname
    });
    // The server will respond with 'allStudents' and 'unreadMessages'
});

socket.on('disconnect', () => {
    console.log('Disconnected from chat server.');
});

socket.on('newNotification', (notification) => {
    console.log('Notification received:', notification);

    // Animate the icon
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

    // After a new notification, request unread messages to update the list
    socket.emit('getUnreadMessages', currentUser.mysqlUserId);
});

// This is the core update for `unreadMessages` display
socket.on('unreadMessages', (messages) => {
    console.log('[Client] Received unreadMessages:', messages);
    console.log('[Client] Dropdown element:', document.querySelector('.notifications .dropdown'));

    // Map messages to include `chatId` and resolve `user` display name
    unreadMessages = messages.map(msg => ({
        chatId: msg.chatId,
        user: getDisplayName(msg.senderId), // This calls getDisplayName for each sender
        text: msg.message
    }));
    updateUnreadDropdown(); // Update the UI dropdown with these messages
});

// --- THIS IS THE CRITICAL PART FOR FIXING THE NAMING ISSUE ---
socket.on('allStudents', (students) => {
    availableStudents = students; // Populate the global availableStudents array
    console.log("All students loaded and availableStudents populated:", availableStudents);

    // IMPORTANT: Re-render the unread messages dropdown if there are any
    // This handles the scenario where 'unreadMessages' arrived BEFORE 'allStudents'
    // It ensures that messages that initially showed 'User {id}' now display correct names.
    if (unreadMessages.length > 0) {
        console.log("Re-rendering unread dropdown with updated student data.");
        updateUnreadDropdown();
    }
});
// --- END CRITICAL PART ---

socket.on('userStatusUpdate', (data) => {
    console.log('User status update:', data);
    const userElement = document.querySelector(`.user-list-item[data-user-id="${data.mysqlUserId}"]`);
    if (userElement) {
        userElement.classList.remove('online', 'offline');
        userElement.classList.add(data.status);
    }
});


// --- Helper Functions ---

function getDisplayName(userId) {
    if (userId === currentUser.mysqlUserId) return 'You';

    // Find the user in the availableStudents array
    // Use == for loose comparison in case one is string and other is number,
    // though your server ensures mysqlUserId is stored as string.
    const user = availableStudents.find(s => s.mysqlUserId == userId);

    // Return the appropriate display name based on available data
    if (user) {
        // Prioritize full name
        if (user.name && user.lastname) {
            return `${user.name} ${user.lastname}`;
        }
        // Fallback to loginName
        if (user.loginName) {
            return user.loginName;
        }
    }
    // Final fallback if user not found or no name/loginName available
    return `User ${userId}`;
}

function renderMessageComponent(msg) {
    return `
        <div class="message">
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
        // Re-attach event listener for the dynamically added button
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', markAllUnreadAsRead);
        }
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

    unreadMessages = [];
    updateUnreadDropdown();
    const notificationCircle = document.getElementById('notification-circle');
    if (notificationCircle) {
        notificationCircle.style.opacity = 0;
    }
}

// --- DOM Content Loaded Event Listener ---

document.addEventListener('DOMContentLoaded', () => {
    const notificationsIcon = document.querySelector('.notificationsIcon');
    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', () => {
            const notificationCircle = document.getElementById('notification-circle');
            if (notificationCircle) {
                notificationCircle.style.opacity = 0;
            }
            window.location.href = '/messages-page-url'; // IMPORTANT: Adjust this URL
        });
    } else {
        console.error("Element with class 'notificationsIcon' not found.");
    }

    // --- ADD THIS CHANGE ---
    // On page load, request unread messages.
    // The 'unreadMessages' socket.on event will then handle populating the dropdown.
    socket.emit('getUnreadMessages', currentUser.mysqlUserId);

    // After 'unreadMessages' event is processed (which calls updateUnreadDropdown),
    // you need to make sure the notification circle becomes visible if there are messages.
    // This is handled by the 'unreadMessages' socket event and the newNotification event.
    // However, if the user already has unread messages when they load the page,
    // the 'unreadMessages' event from `getUnreadMessages` should trigger the circle.
    // Let's ensure the `newNotification` logic (which shows the circle) is also triggered for existing unread.
});

// --- MODIFY THE 'unreadMessages' SOCKET HANDLER ---
// To ensure the red circle appears if messages are received on page load.
socket.on('unreadMessages', (messages) => {
    console.log('[Client] Received unreadMessages:', messages);
    console.log('[Client] Dropdown element:', document.querySelector('.notifications .dropdown'));

    unreadMessages = messages.map(msg => ({
        chatId: msg.chatId,
        user: getDisplayName(msg.senderId),
        text: msg.message
    }));
    updateUnreadDropdown();

    // If there are unread messages, ensure the notification circle is visible
    if (messages.length > 0) {
        const notificationCircle = document.getElementById('notification-circle');
        if (notificationCircle) {
            notificationCircle.style.opacity = 1;
        }
    } else {
        // If no unread messages, hide the circle
        const notificationCircle = document.getElementById('notification-circle');
        if (notificationCircle) {
            notificationCircle.style.opacity = 0;
        }
    }
});