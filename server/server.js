"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*'
    }
});
const rooms = [];
const users = {};
const checkWin = (board, turn) => {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    return winConditions.some(([a, b, c]) => board[a] === turn && board[b] === turn && board[c] === turn);
};
io.on('connection', (socket) => {
    socket.on('login', (username) => {
        if (Object.values(users).includes(username)) {
            socket.emit('errorMessage', 'User already logged in');
        }
        else {
            users[socket.id] = username;
            socket.emit('loginSuccess', username);
            io.emit('rooms', rooms);
        }
    });
    socket.on('createRoom', (roomName) => {
        if (!users[socket.id]) {
            socket.emit('errorMessage', 'You must be logged in to create a room');
            return;
        }
        const room = rooms.find((room) => room.name === roomName);
        if (room) {
            socket.emit('errorMessage', 'Rooms name already exist');
            return;
        }
        const newRoom = {
            name: roomName,
            id: `room-${Date.now()}`,
            players: [],
            gameState: null,
        };
        rooms.push(newRoom);
        io.emit('rooms', rooms);
    });
    socket.on('joinRoom', (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) {
            socket.emit('errorMessage', 'Room does not exist');
            return;
        }
        if (room.players.length >= 2) {
            socket.emit('errorMessage', 'Room is full');
            return;
        }
        room.players.push({ name: users[socket.id], id: socket.id });
        socket.join(roomId);
        if (room.players.length === 2) {
            room.gameState = {
                board: Array(9).fill(''),
                currentPlayer: room.players[0].id,
            };
            io.to(roomId).emit('gameState', room.gameState);
            io.to(roomId).emit('user-join', users[socket.id]);
        }
        io.emit('rooms', rooms);
    });
    socket.on('makeMove', ({ roomId, index }) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) {
            socket.emit('errorMessage', 'Room does not exist');
            return;
        }
        const gameState = room.gameState;
        if (!gameState) {
            socket.emit('errorMessage', 'Game not started yet');
            return;
        }
        const currentPlayerIndex = room.players.findIndex((r) => r.id === socket.id);
        if (currentPlayerIndex === -1) {
            socket.emit('errorMessage', 'You are not a player in this room');
            return;
        }
        const currentSign = currentPlayerIndex === 0 ? 'X' : 'O';
        if (socket.id !== gameState.currentPlayer) {
            socket.emit('errorMessage', 'It\'s not your turn');
            return;
        }
        if (gameState.board[index] !== '') {
            socket.emit('errorMessage', 'Invalid move');
            return;
        }
        gameState.board[index] = currentSign;
        gameState.currentPlayer = room.players[1 - currentPlayerIndex].id;
        io.to(roomId).emit('gameState', gameState);
        if (checkWin(gameState.board, currentSign)) {
            io.to(roomId).emit('gameOver', {
                type: 'win',
                userId: socket.id
            });
            room.gameState = null;
        }
        else if (gameState.board.every(cell => cell !== '')) {
            io.to(roomId).emit('gameOver', {
                type: 'draw',
            });
            room.gameState = null;
        }
        io.emit('rooms', rooms);
    });
    socket.on('exitRoom', (roomId) => {
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) {
            return;
        }
        const room = rooms[roomIndex];
        room.players = room.players.filter(player => player.id !== socket.id);
        io.to(roomId).emit('user-leave', users[socket.id]);
        if (room.players.length === 0) {
            // rooms.splice(roomIndex, 1);
        }
        else {
            room.gameState = null;
            io.to(roomId).emit('gameState', null);
        }
        socket.leave(roomId);
        io.emit('rooms', rooms);
    });
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            room.players = room.players.filter((player) => player.id !== socket.id);
        }
        delete users[socket.id];
        io.emit('rooms', Object.values(rooms));
    });
});
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Hello World!');
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
