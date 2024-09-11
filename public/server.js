// server/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

let rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Create a room
    socket.on('createRoom', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [socket.id], board: Array(9).fill(null), turn: 'X' };
            socket.join(roomId);
            console.log(`Room created with ID: ${roomId} by ${socket.id}`);
            socket.emit('roomCreated', roomId);
        } else {
            socket.emit('error', 'Room ID already exists. Please choose a different ID.');
        }
    });

    // Join a room
    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId]) {
            if (rooms[roomId].players.length < 2) {
                rooms[roomId].players.push(socket.id);
                socket.join(roomId);
                console.log(`Player ${socket.id} joined room: ${roomId}`);
                
                // Emit startGame event only when there are exactly 2 players
                if (rooms[roomId].players.length === 2) {
                    console.log(`Both players joined. Starting game in room: ${roomId}`);
                    io.to(roomId).emit('startGame', { roomId, players: rooms[roomId].players, board: rooms[roomId].board });
                }
            } else {
                socket.emit('error', 'Room is full. Cannot join.');
            }
        } else {
            socket.emit('error', 'Room does not exist.');
        }
    });

    // Handle player move
    socket.on('move', ({ roomId, index }) => {
        console.log(`Received move for room ${roomId}, index: ${index}`);
        if (rooms[roomId]) {
            const room = rooms[roomId];
            if (room.board[index] === null && room.players.length === 2) {  // Check if cell is empty and game has started
                room.board[index] = room.turn;
                room.turn = room.turn === 'X' ? 'O' : 'X';
                console.log('Updated board:', room.board);
                io.to(roomId).emit('updateBoard', room.board);
            }
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        for (let roomId in rooms) {
            rooms[roomId].players = rooms[roomId].players.filter((id) => id !== socket.id);
            if (rooms[roomId].players.length === 0) {
                delete rooms[roomId];
                console.log(`Room ${roomId} deleted as both players left.`);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
 