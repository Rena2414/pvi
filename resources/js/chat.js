import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000';

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null;
let allUsers = new Map(); 
let activeChats = [];  
let selectedParticipants = new Set(); 


let receivedAllUsersData = false; 
let pendingChatsData = [];        

let unreadMessages = [];
let pendingUnreadMessages = [];

const chatsList = document.getElementById('chats-list');
const messagesHistory = document.getElementById('messages-history');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const currentChatName = document.getElementById('current-chat-name');
const createNewChatBtn = document.getElementById('create-new-chat-btn');
const createChatModal = document.getElementById('create-chat-modal');
const availableStudentsDiv = document.getElementById('available-students'); 
const newChatNameInput = document.getElementById('new-chat-name-input');
const confirmCreateChatBtn = document.getElementById('confirm-create-chat-btn');
const cancelCreateChatBtn = document.getElementById('cancel-create-chat-btn');
const addParticipantBtn = document.getElementById('add-participant-btn');
const addParticipantModal = document.getElementById('add-participant-modal');
const availableParticipantsDiv = document.getElementById('available-participants-for-add');
const confirmAddParticipantsBtn = document.getElementById('confirm-add-participants-btn');
const cancelAddParticipantsBtn = document.getElementById('cancel-add-participants-btn');
const closeAddParticipantsBtn = document.getElementById('close-add-participants-btn');
const notificationsDropdown = document.querySelector('.notifications .dropdown'); 
const planeIcon = document.querySelector('.plane-icon');
const notificationCircle = document.getElementById('notification-circle');
const notificationsContainer = document.querySelector('.notifications');
document.getElementById('add-participant-btn').style.display = 'none';
document.getElementById('current-chat-name').textContent = 'Select a Chat';


const currentUser = {
    mysqlUserId: window.chatConfig.studentId,
    loginName: window.chatConfig.loginName,
    name: window.chatConfig.studentName,
    lastname: window.chatConfig.studentLastname
};



function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function closeAddParticipantModal() {
    addParticipantModal.style.display = 'none';
    selectedParticipants.clear();
}

function openCreateChatModal() {
    createChatModal.style.display = 'flex';
    selectedParticipants.clear();
    newChatNameInput.value = '';
    renderAvailableStudents(); 
}

function closeCreateChatModal() {
    createChatModal.style.display = 'none';
}

function openAddParticipantModal() {
    if (!currentChatId) {
        alert('Please select a chat first.');
        return;
    }
    addParticipantModal.style.display = 'flex';
    selectedParticipants.clear();
    renderAvailableParticipantsForAdd(); 
}

function confirmAddParticipants() {
    const participantsToAdd = Array.from(selectedParticipants);

    if (participantsToAdd.length === 0) {
        alert('Please select at least one participant to add.');
        return;
    }

    if (!currentChatId) {
        alert('No chat selected to add participants to.');
        return;
    }

    socket.emit('addParticipantsToChat', {
        chatId: currentChatId,
        newParticipantIds: participantsToAdd
    });

    closeAddParticipantModal();
}


function processInitialData() {
    if (receivedAllUsersData && pendingChatsData.length > 0) {
        console.log("[chat.js] Both allUsers and chatsList received. Processing initial chat data.");
        renderChatsList(pendingChatsData);
        initializeChatOnPageLoad();
        pendingChatsData = [];
    } else {
        console.log("[chat.js] Waiting for all initial chat data. receivedAllUsersData:", receivedAllUsersData, "pendingChatsData length:", pendingChatsData.length);
    }

    if (receivedAllUsersData && pendingUnreadMessages.length > 0) {
        console.log("[chat.js] All users and pending unread messages received. Processing unread messages.");
        processUnreadMessages(pendingUnreadMessages);
        pendingUnreadMessages = []; // Clear pending messages after processing
    }
}


function initializeChatOnPageLoad() {
    const initialChatId = getQueryParam('chatId');
    if (initialChatId) {
        console.log(`[Chat.js] Attempting to open chat from URL: ${initialChatId}`);
        const chatToOpen = activeChats.find(chat => chat._id === initialChatId);
        if (chatToOpen) {
            let chatWindowDisplayName = chatToOpen.name;
            if (chatToOpen.type === 'private' && chatToOpen.otherParticipantMySqlId) {
                const otherUser = allUsers.get(chatToOpen.otherParticipantMySqlId);
                if (otherUser) {
                    chatWindowDisplayName = `${otherUser.name} ${otherUser.lastname}`;
                }
            }
            joinChat(initialChatId, chatWindowDisplayName);
        } else {
            console.warn(`[Chat.js] Chat with ID ${initialChatId} not found in active chats.`);
        }
    }
}


socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,
        lastname: currentUser.lastname
    });
    socket.emit('requestAllUsers');
    socket.emit('requestChatsList', currentUser.mysqlUserId); 
    socket.emit('getUnreadMessages', currentUser.mysqlUserId);
});


socket.on('disconnect', () => {
    console.log('Disconnected from chat server.');
});

socket.on('chatError', (message) => {
    console.error('Chat Error:', message);
    alert('Chat Error: ' + message);
});

socket.on('allUsersList', (users) => {
    allUsers.clear(); 
    users.forEach(user => {
        allUsers.set(user.mysqlUserId, user); 
    });
    console.log('[chat.js] Updated allUsers map:', allUsers);
    receivedAllUsersData = true; 
    renderAvailableStudents();
    processInitialData(); 
    
});

socket.on('unreadMessages', (messages) => {
    console.log('[Client Chat.js] Received unreadMessages:', messages);

    if (!receivedAllUsersData) {
        pendingUnreadMessages = messages; 
        console.log("Unread messages received before all users in chat.js, storing them.");
        return;
    }

    processUnreadMessages(messages);
});


socket.on('chatsList', (chats) => {
    console.log('[chat.js] Received chats list:', chats);
    pendingChatsData = chats; 
    processInitialData(); 
});


socket.on('participantsAdded', (data) => {
    console.log('Participants added to chat:', data);
    socket.emit('requestChatsList', currentUser.mysqlUserId); 

    if (data.chatId === currentChatId) {
        setTimeout(() => {
            const updatedChat = activeChats.find(chat => chat._id === currentChatId);
            if (updatedChat) {
                let chatWindowDisplayName = updatedChat.name;
                if (updatedChat.type === 'private' && updatedChat.otherParticipantMySqlId) {
                    const otherUser = allUsers.get(updatedChat.otherParticipantMySqlId);
                    if (otherUser) {
                        chatWindowDisplayName = `${otherUser.name} ${otherUser.lastname}`;
                    }
                }
                joinChat(updatedChat._id, chatWindowDisplayName);
            }
        }, 100);
    }
    alert(`Participants added to chat ${data.chatId}!`);
});

socket.on('chatCreated', (newChat) => {
    console.log('New chat created:', newChat);
    socket.emit('requestChatsList', currentUser.mysqlUserId); 
    closeCreateChatModal();
    
    let displayName = newChat.name;
    if (newChat.type === 'private' && newChat.participants.length === 2) {
        const otherParticipantId = newChat.participants.find(p => p !== currentUser.mysqlUserId);
        const otherUser = allUsers.get(otherParticipantId); 
        if (otherUser) {
            displayName = `${otherUser.name} ${otherUser.lastname}`;
        } else {
            displayName = `Private Chat with ID: ${otherParticipantId}`; 
        }
    }
    joinChat(newChat._id, displayName);
});


socket.on('chatHistory', (data) => {
    if (data.chatId === currentChatId) {
        messagesHistory.innerHTML = '';
        data.messages.forEach(msg => displayMessage(msg));
        messagesHistory.scrollTop = messagesHistory.scrollHeight;
    }
});


socket.on('newMessage', (message) => {
    if (message.chatId === currentChatId) {
        // Message is for the currently open chat, display it directly
        displayMessage(message);
        messagesHistory.scrollTop = messagesHistory.scrollHeight;
        // Mark as read immediately since the user is viewing the chat
        socket.emit('markMessagesAsRead', {
            chatId: message.chatId,
            userId: currentUser.mysqlUserId,
            messageIds: [message._id] // Mark this specific message as read
        });
        // Request unread messages to update the dropdown (should decrease count)
        socket.emit('getUnreadMessages', currentUser.mysqlUserId);
    } else {
        // Message is for another chat, trigger notification and update dropdown
        console.log('New message in another chat:', message);
        triggerNotificationAnimation(); // New function call
        socket.emit('getUnreadMessages', currentUser.mysqlUserId); // Request unread messages to update dropdown
    }
});

socket.on('refreshMyChatsList', () => {
    console.log('[Client] Received request to refresh chats list from server.');
    socket.emit('requestChatsList', currentUser.mysqlUserId);
});

socket.on('newNotification', (notification) => {
    if (notification.chatId !== currentChatId) {
        console.log('Notification received:', notification);
        triggerNotificationAnimation(); // Use the consolidated function
        socket.emit('getUnreadMessages', currentUser.mysqlUserId); // Request unread messages
    }
});

function triggerNotificationAnimation() {
    if (planeIcon) planeIcon.classList.add('animate');
    if (notificationCircle) notificationCircle.style.opacity = 1;
    if (notificationsContainer) notificationsContainer.classList.add('no-hover');

    setTimeout(() => {
        if (planeIcon) planeIcon.classList.remove('animate');
    }, 500);

    setTimeout(() => {
        if (notificationsContainer) notificationsContainer.classList.remove('no-hover');
    }, 750);
}

socket.on('userStatusUpdate', (data) => {
    console.log('User status update:', data);
    if (allUsers.has(data.mysqlUserId)) {
        const user = allUsers.get(data.mysqlUserId);
        user.status = data.status; 
        allUsers.set(data.mysqlUserId, user); 
    }
    renderAvailableStudents(); 
    renderChatsList(activeChats); 
    if (currentChatId) {
        const currentChat = activeChats.find(chat => chat._id === currentChatId);
        if (currentChat) {
            joinChat(currentChatId, currentChatName.textContent);
        }
    }
});


function renderChatsList(chatsToRender) {
    chatsList.innerHTML = '';
    activeChats = chatsToRender; 

    chatsToRender.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.dataset.chatId = chat._id;

        let displayHtml = '';
        let chatWindowDisplayName = chat.name || 'Unnamed Chat'; 

        if (chat.type === 'private' && chat.otherParticipantMySqlId) {
            const otherUser = allUsers.get(chat.otherParticipantMySqlId);

            if (otherUser) {
                const isOnline = otherUser.status === 'online';
                const color = isOnline ? 'green' : 'gray';
                const fontWeight = isOnline ? 'bold' : 'normal';
                displayHtml = `<span style="color: ${color}; font-weight: ${fontWeight};">
                                    ${chat.name}
                                </span>`;
                chatWindowDisplayName = `${otherUser.name} ${otherUser.lastname}`; 
            } else {
                console.warn(`User details (for status display) not found in allUsers for ID: ${chat.otherParticipantMySqlId}.`);
                displayHtml = `<span style="color: gray;">${chat.name || 'Unknown User'}</span>`;
                chatWindowDisplayName = chat.name || 'Unknown User';
            }
        } else {
            displayHtml = chat.name || 'Unnamed Group Chat';
            chatWindowDisplayName = chat.name || 'Unnamed Group Chat';
        }

        chatItem.innerHTML = displayHtml;
        chatItem.addEventListener('click', () => joinChat(chat._id, chatWindowDisplayName));
        chatsList.appendChild(chatItem);
    });
    if (currentChatId) {
        const newChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
        if (newChatItem) newChatItem.classList.add('active-chat');
    }
}


function displayMessage(message) {
    const messageElement = document.createElement('div');
    const isSent = message.senderId === currentUser.mysqlUserId;
    messageElement.classList.add('message-item', isSent ? 'sent' : 'received');

    let senderDisplayName = isSent ? `${currentUser.name} ${currentUser.lastname} (You)` : message.senderId;

    if (!isSent) {
        const senderUser = allUsers.get(message.senderId); 
        if (senderUser) {
            senderDisplayName = `${senderUser.name} ${senderUser.lastname}`;
        }
    }

    const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageElement.innerHTML = `
        <strong>${senderDisplayName}</strong>
        <div>${message.message}</div>
        <span class="timestamp">${timestamp}</span>
    `;

    messagesHistory.appendChild(messageElement);
}


function joinChat(chatId, chatName) {
    if (currentChatId) {
        const prevChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
        if (prevChatItem) prevChatItem.classList.remove('active-chat');
    }

    currentChatId = chatId;
    currentChatName.textContent = chatName;

    socket.emit('joinChat', chatId);
     socket.emit('markMessagesAsRead', {
        chatId: chatId,
        userId: currentUser.mysqlUserId
    });

    socket.emit('getUnreadMessages', currentUser.mysqlUserId);

    document.getElementById('add-participant-btn').style.display = 'inline-block';

    const participantsContainer = document.getElementById('chat-participants');
    participantsContainer.innerHTML = ''; 

    const createNameSpan = (name, color, isYou = false) => {
        const span = document.createElement('span');
        span.textContent = isYou ? `${name} (You)` : name;
        span.style.color = color;
        span.style.marginRight = '10px';
        return span;
    };

    participantsContainer.appendChild(createNameSpan(
        `${currentUser.name} ${currentUser.lastname}`,
        'green',
        true
    ));

    const currentChat = activeChats.find(chat => chat._id === currentChatId);
    if (currentChat) {
        currentChat.participants
            .filter(pid => pid !== currentUser.mysqlUserId)
            .forEach(pid => {
                const user = allUsers.get(pid); 
                const name = user ? `${user.name} ${user.lastname}` : 'Unknown';
                const color = user?.status === 'online' ? 'green' : 'gray';
                participantsContainer.appendChild(createNameSpan(name, color));
            });
    }

    

    const newChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
    if (newChatItem) newChatItem.classList.add('active-chat');
    document.getElementById('current-chat-name').textContent = chatName;
}

function renderAvailableStudents() {
    availableStudentsDiv.innerHTML = '<h4>Select Participants:</h4>';
    const studentsToDisplay = Array.from(allUsers.values()).filter(s => s.mysqlUserId !== currentUser.mysqlUserId);

    if (studentsToDisplay.length === 0) {
        availableStudentsDiv.innerHTML += '<p>No other students available.</p>';
        return;
    }

    studentsToDisplay.forEach(student => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `student-${student.mysqlUserId}`;
        checkbox.value = student.mysqlUserId;
        checkbox.checked = selectedParticipants.has(student.mysqlUserId);

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedParticipants.add(student.mysqlUserId);
            } else {
                selectedParticipants.delete(student.mysqlUserId);
            }
        });

        const label = document.createElement('label');
        label.htmlFor = `student-${student.mysqlUserId}`;
        label.textContent = `${student.name} ${student.lastname} (${student.loginName})`;
        const statusSpan = document.createElement('span');
        statusSpan.classList.add('user-status');
        if (student.status === 'online') {
            statusSpan.textContent = ' (online)';
            statusSpan.style.color = 'green';
            label.style.fontWeight = 'bold';
        } else {
            statusSpan.textContent = ' (offline)';
            statusSpan.style.color = 'gray';
        }
        label.appendChild(statusSpan);

        div.appendChild(checkbox);
        div.appendChild(label);
        availableStudentsDiv.appendChild(div);
    });
}


function renderAvailableParticipantsForAdd() {
    availableParticipantsDiv.innerHTML = '<h4>Select Participants to Add:</h4>';

    const currentChat = activeChats.find(chat => chat._id === currentChatId);

    if (!currentChat) {
        availableParticipantsDiv.innerHTML += '<p>Error: Could not find current chat participants.</p>';
        return;
    }

    const existingParticipantIds = new Set(currentChat.participants);

    const nonParticipants = Array.from(allUsers.values()).filter(s => !existingParticipantIds.has(s.mysqlUserId));

    if (nonParticipants.length === 0) {
        availableParticipantsDiv.innerHTML += '<p>No new students available to add to this chat.</p>';
        return;
    }

    nonParticipants.forEach(student => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `add-student-${student.mysqlUserId}`;
        checkbox.value = student.mysqlUserId;

        checkbox.checked = selectedParticipants.has(student.mysqlUserId);

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedParticipants.add(student.mysqlUserId);
            } else {
                selectedParticipants.delete(student.mysqlUserId);
            }
        });

        const label = document.createElement('label');
        label.htmlFor = `add-student-${student.mysqlUserId}`;
        label.textContent = `${student.name} ${student.lastname} (${student.loginName})`;

        const statusSpan = document.createElement('span');
        statusSpan.classList.add('user-status');
        if (student.status === 'online') {
            statusSpan.textContent = ' (online)';
            statusSpan.style.color = 'green';
            label.style.fontWeight = 'bold';
        } else {
            statusSpan.textContent = ' (offline)';
            statusSpan.style.color = 'gray';
        }
        label.appendChild(statusSpan);

        div.appendChild(checkbox);
        div.appendChild(label);
        availableParticipantsDiv.appendChild(div);
    });
}


sendMessageBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && currentChatId) {
        socket.emit('sendMessage', { chatId: currentChatId, message: message });
        messageInput.value = '';
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessageBtn.click();
    }
});

createNewChatBtn.addEventListener('click', () => {
    openCreateChatModal();
});

confirmCreateChatBtn.addEventListener('click', () => {
    const chatName = newChatNameInput.value.trim();
    const participantsArray = Array.from(selectedParticipants);
    // Always include the current user in the participants array for the server
    participantsArray.push(currentUser.mysqlUserId); 

    if (participantsArray.length === 0 || (participantsArray.length === 1 && participantsArray[0] === currentUser.mysqlUserId)) {
        alert('Please select at least one other participant.');
        return;
    }

    const chatType = participantsArray.length === 2 ? 'private' : 'group'; 

    socket.emit('createChat', {
        participants: participantsArray,
        type: chatType,
        name: chatName
    });
});

cancelCreateChatBtn.addEventListener('click', () => {
    closeCreateChatModal();
});

addParticipantBtn.addEventListener('click', () => {
    openAddParticipantModal();
});

confirmAddParticipantsBtn.addEventListener('click', () => {
    confirmAddParticipants();
});

cancelAddParticipantsBtn.addEventListener('click', () => {
    closeAddParticipantModal();
});

closeAddParticipantsBtn.addEventListener('click', () => {
    closeAddParticipantModal();
});

document.addEventListener('DOMContentLoaded', () => {
    const notificationsPageIcon = document.querySelector('.notificationsIcon'); // Assuming this takes you to /messages page
    if (notificationsPageIcon) {
        notificationsPageIcon.addEventListener('click', () => {
            if (notificationCircle) notificationCircle.style.opacity = 0;
            window.location.href = '/messages'; // Navigate to the page that loads chat.js
        });
    }
});


// --- ADD THESE NEW FUNCTIONS ---

// Function to encapsulate processing unread messages
function processUnreadMessages(messages) {
    // Filter out messages for the currently open chat from the unread list
    unreadMessages = messages.filter(msg => msg.chatId !== currentChatId).map(msg => ({
        chatId: msg.chatId,
        user: getDisplayName(msg.senderId), // Uses allUsers map via getDisplayName
        text: msg.message,
        _id: msg._id // Ensure message ID is passed for marking specific messages
    }));
    updateUnreadDropdown();

    // Update notification circle opacity based on message count
    if (notificationCircle) {
        notificationCircle.style.opacity = unreadMessages.length > 0 ? 1 : 0;
    }
}

function getDisplayName(userId) {
    if (userId === currentUser.mysqlUserId) return 'You';

    const user = allUsers.get(userId); // Use allUsers map directly

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
    // This renders a single message item in the dropdown
    return `
        <div class="message-dropdown-item" data-chat-id="${msg.chatId}" data-message-id="${msg._id}">
            <div class="message-content">
                <span class="user-name">${msg.user}</span>
                <p class="message-text">${msg.text}</p>
            </div>
        </div>
    `;
}

function updateUnreadDropdown() {
    if (!notificationsDropdown) {
        console.error('Notifications dropdown element not found!');
        return;
    }

    if (unreadMessages.length === 0) {
        notificationsDropdown.innerHTML = '<div class="no-messages">No unread messages</div>';
    } else {
        const messagesHtml = unreadMessages.map(renderMessageComponent).join('');
        notificationsDropdown.innerHTML = `
            ${messagesHtml}
            <div class="dropdown-footer">
                <button id="markAllReadBtn" class="mark-all-read-button">Mark All as Read</button>
            </div>
        `;
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', markAllUnreadAsRead);
        }

        notificationsDropdown.querySelectorAll('.message-dropdown-item').forEach(messageDiv => {
            messageDiv.addEventListener('click', (event) => {
                const clickedChatId = messageDiv.dataset.chatId;
                const clickedMessageId = messageDiv.dataset.messageId; // Get message ID
                if (clickedChatId) {
                    // Mark this specific message as read
                    socket.emit('markMessagesAsRead', {
                        chatId: clickedChatId,
                        userId: currentUser.mysqlUserId,
                        messageIds: [clickedMessageId]
                    });
                    // Navigate to the chat page with the chat ID in the URL
                    window.location.href = `/messages?chatId=${clickedChatId}`;
                }
            });
        });
    }
}

function markAllUnreadAsRead() {
    const allUnreadMessageIds = unreadMessages.map(msg => msg._id);

    if (allUnreadMessageIds.length > 0) {
        // Emit for all unique message IDs if your server supports marking multiple messages as read
        socket.emit('markMessagesAsRead', {
            chatId: null, // Set to null or a specific chat ID if your server requires it
            userId: currentUser.mysqlUserId,
            messageIds: allUnreadMessageIds
        });
    }

    unreadMessages = []; // Clear local unread messages
    updateUnreadDropdown(); // Update the UI to show no messages
    if (notificationCircle) {
        notificationCircle.style.opacity = 0;
    }
}


if (notificationsContainer) {
    notificationsContainer.addEventListener('click', (event) => {
        // Prevent click inside dropdown from closing it
        if (notificationsDropdown && notificationsDropdown.contains(event.target)) {
            return;
        }
        // Toggle display
        notificationsDropdown.style.display = notificationsDropdown.style.display === 'block' ? 'none' : 'block';
    });
    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (notificationsContainer && !notificationsContainer.contains(event.target)) {
            if (notificationsDropdown) {
                notificationsDropdown.style.display = 'none';
            }
        }
    });
}