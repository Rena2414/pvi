import { io } from 'socket.io-client'; 

const SOCKET_SERVER_URL = 'http://localhost:3000'; 

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null; 
let availableStudents = []; 
let selectedParticipants = new Set(); 


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

socket.on('newMessage', (message) => {
        console.log('New message in another chat or outside /messages:', message);

        const plane = document.querySelector('.plane-icon');
        plane.classList.add('animate');
        document.getElementById('notification-circle').style.opacity = 1;
        document.querySelector('.notifications').classList.add('no-hover');

        setTimeout(() => {
            plane.classList.remove('animate');
        }, 500);

        setTimeout(() => {
            document.querySelector('.notifications').classList.remove('no-hover');
        }, 750);
});

socket.on('newNotification', (notification) => {
    console.log('Notification received:', notification);

    const plane = document.querySelector('.plane-icon');
    plane.classList.add('animate');
    document.getElementById('notification-circle').style.opacity = 1;
    document.querySelector('.notifications').classList.add('no-hover');

    setTimeout(() => {
        plane.classList.remove('animate');
    }, 500);

    setTimeout(() => {
        document.querySelector('.notifications').classList.remove('no-hover');
    }, 750);
});


socket.on('userStatusUpdate', (data) => {
    console.log('User status update:', data);
    const userElement = document.querySelector(`.user-list-item[data-user-id="${data.mysqlUserId}"]`);
    if (userElement) {
        userElement.classList.remove('online', 'offline');
        userElement.classList.add(data.status);
    }
});