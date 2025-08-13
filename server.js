const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {};

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('joinRoom', (room) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    currentRoom = room;
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);
    io.to(room).emit('message', { sender: 'SYSTEM', text: `${socket.id} entrou na sala.` });
  });

  socket.on('chatMessage', (msg) => {
    if (currentRoom) {
      io.to(currentRoom).emit('message', { sender: socket.id, text: msg });
    }
  });

  socket.on('deleteMessage', (index) => {
    io.to(socket.id).emit('deleteMessage', index);
  });

  socket.on('giveBag', () => {
    if (currentRoom) {
      io.to(currentRoom).emit('message', { sender: 'SYSTEM', text: `${socket.id} deu um soquinho 👊` });
      io.to(currentRoom).emit('playerHit', socket.id); // avisa todos que alguém socou
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom] = rooms[currentRoom].filter(id => id !== socket.id);
      io.to(currentRoom).emit('message', { sender: 'SYSTEM', text: `${socket.id} saiu da sala.` });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
