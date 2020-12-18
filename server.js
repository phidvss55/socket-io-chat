const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'Chatcord Bot';

const PORT = 3000 || process.env.PORT;

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

       // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to Chatcord'));

        // Broadcast when a user connect
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`)); 

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnection
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.emit('message', formatMessage(botName, `${user.username} has left the chat`));
        }

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        }); 
    });
});

// io.emit('some event', { Property: 'some value', otherProperty: ['other value']}

server.listen(PORT, () => console.log(`Listing on *:${PORT}`));
