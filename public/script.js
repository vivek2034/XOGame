// public/script.js

const socket = io();

const createRoomBtn = document.getElementById('create-room');
const joinRoomBtn = document.getElementById('join-room');
const roomIdInput = document.getElementById('room-id');
const board = document.getElementById('board');
const cells = Array.from(document.getElementsByClassName('cell'));

let currentRoom = null;
let currentPlayer = 'X';
let isPlayerTurn = false;

createRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();
    if (roomId) {
        console.log(`Creating room with ID: ${roomId}`);
        socket.emit('createRoom', roomId);
    } else {
        alert('Please enter a valid room ID');
    }
});

joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();
    if (roomId) {
        console.log(`Joining room with ID: ${roomId}`);
        socket.emit('joinRoom', roomId);
    } else {
        alert('Please enter a valid room ID');
    }
});

socket.on('roomCreated', (roomId) => {
    currentRoom = roomId;
    alert(`Room created with ID: ${roomId}`);
});

socket.on('roomJoined', (roomId) => {
    currentRoom = roomId;
    alert(`Joined room: ${roomId}`);
});

socket.on('startGame', (room) => {
    console.log(`Game started in room: ${room.roomId} with players: ${room.players}`);
    currentRoom = room.roomId;
    currentPlayer = room.players[0] === socket.id ? 'X' : 'O'; // Determine if the player is 'X' or 'O'
    isPlayerTurn = currentPlayer === 'X'; // X always starts
    alert(`Game started! You are '${currentPlayer}'`);
});

socket.on('updateBoard', (newBoard) => {
    updateBoard(newBoard);
    isPlayerTurn = !isPlayerTurn; // Toggle turn after a move
    console.log(`It's now ${isPlayerTurn ? 'your' : "opponent's"} turn.`);
});

cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        console.log(`Cell ${index} clicked`);
        if (currentRoom && cell.textContent === '' && isPlayerTurn) { // Ensure the cell is empty
            console.log(`Emitting move to server: roomId = ${currentRoom}, index = ${index}`);
            socket.emit('move', { roomId: currentRoom, index });
        } else {
            console.log(`Cannot click on cell ${index}. Either no room is joined, cell is already occupied, or it's not your turn.`);
        }
    });
});

function updateBoard(newBoard) {
    newBoard.forEach((mark, index) => {
        cells[index].textContent = mark || ''; // Update the UI with the latest board state
    });
}
