const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" }
});

// serve /public
app.use(express.static(path.join(__dirname, 'public')));

// simple rooms
io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('joinRoom', (room) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    currentRoom = room;
    socket.join(room);
    socket.emit('message', { sender: 'SYSTEM', text: `Você entrou na sala "${room}"` });
    socket.to(room).emit('message', { sender: 'SYSTEM', text: `${socket.id} entrou na sala.` });
  });

  socket.on('chatMessage', (msg) => {
    if (currentRoom) {
      io.to(currentRoom).emit('message', { sender: socket.id, text: msg });
    }
  });

  socket.on('giveBag', () => {
    if (currentRoom) {
      // avisa todos que o jogador levou um "soco"
      io.to(currentRoom).emit('playerHit', socket.id);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      socket.to(currentRoom).emit('message', { sender: 'SYSTEM', text: `${socket.id} saiu da sala.` });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));