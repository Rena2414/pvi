
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000'; 

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null;
let availableStudents = []; 
let selectedParticipants = new Set();
let unreadMessages = []; 


const currentUser = {
    mysqlUserId: window.chatConfig.studentId,
    loginName: window.chatConfig.loginName,
    name: window.chatConfig.studentName,
    lastname: window.chatConfig.studentLastname
};


socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,
        lastname: currentUser.lastname
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from chat server.');
});

socket.on('newNotification', (notification) => {
    console.log('Notification received:', notification);

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

    socket.emit('getUnreadMessages', currentUser.mysqlUserId);
});

socket.on('unreadMessages', (messages) => {
    console.log('[Client] Received unreadMessages:', messages);
    console.log('[Client] Dropdown element:', document.querySelector('.notifications .dropdown'));

    unreadMessages = messages.map(msg => ({
        chatId: msg.chatId,
        user: getDisplayName(msg.senderId), 
        text: msg.message
    }));
    updateUnreadDropdown();
});

socket.on('allStudents', (students) => {
    availableStudents = students; 
    console.log("All students loaded and availableStudents populated:", availableStudents);

    if (unreadMessages.length > 0) {
        console.log("Re-rendering unread dropdown with updated student data.");
        updateUnreadDropdown();
    }
});


socket.on('userStatusUpdate', (data) => {
    console.log('User status update:', data);
    const userElement = document.querySelector(`.user-list-item[data-user-id="${data.mysqlUserId}"]`);
    if (userElement) {
        userElement.classList.remove('online', 'offline');
        userElement.classList.add(data.status);
    }
});




function getDisplayName(userId) {
    if (userId === currentUser.mysqlUserId) return 'You';

    const user = availableStudents.find(s => s.mysqlUserId == userId);

    if (user) {
        if (user.name && user.lastname) {
            return `${user.name} ${user.lastname}`;
        }
        if (user.loginName) {
            return user.loginName;
        }
    }
    return `User ${userId}`;
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

    unreadMessages = [];
    updateUnreadDropdown();
    const notificationCircle = document.getElementById('notification-circle');
    if (notificationCircle) {
        notificationCircle.style.opacity = 0;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const notificationsIcon = document.querySelector('.notificationsIcon');
    if (notificationsIcon) {
        notificationsIcon.addEventListener('click', () => {
            const notificationCircle = document.getElementById('notification-circle');
            if (notificationCircle) {
                notificationCircle.style.opacity = 0;
            }
            window.location.href = '/messages'; 
        });
    } else {
        console.error("Element with class 'notificationsIcon' not found.");
    }

    socket.emit('getUnreadMessages', currentUser.mysqlUserId);
});


socket.on('unreadMessages', (messages) => {
    console.log('[Client] Received unreadMessages:', messages);
    console.log('[Client] Dropdown element:', document.querySelector('.notifications .dropdown'));

    unreadMessages = messages.map(msg => ({
        chatId: msg.chatId,
        user: getDisplayName(msg.senderId),
        text: msg.message
    }));
    updateUnreadDropdown();

    if (messages.length > 0) {
        const notificationCircle = document.getElementById('notification-circle');
        if (notificationCircle) {
            notificationCircle.style.opacity = 1;
        }
    } else {
        const notificationCircle = document.getElementById('notification-circle');
        if (notificationCircle) {
            notificationCircle.style.opacity = 0;
        }
    }
});