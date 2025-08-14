const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {}; // { roomId: { players: {}, multiplier:1, level:1 } }

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('createRoom', ({roomId, name}, cb) => {
    if (!roomId) roomId = Math.random().toString(36).slice(2,8);
    if (rooms[roomId]) return cb({ ok: false, error: 'room_exists' });
    rooms[roomId] = { players: {}, multiplier: 1, level: 1 };
    socket.join(roomId);
    rooms[roomId].players[socket.id] = { id: socket.id, name: name||'Player', score:0 };
    socket.data.roomId = roomId;
    io.to(roomId).emit('roomUpdate', rooms[roomId]);
    cb({ ok: true, roomId });
  });

  socket.on('joinRoom', ({roomId, name}, cb) => {
    const room = rooms[roomId];
    if (!room) return cb({ ok: false, error: 'no_room' });
    socket.join(roomId);
    room.players[socket.id] = { id: socket.id, name: name||'Player', score:0 };
    socket.data.roomId = roomId;
    io.to(roomId).emit('roomUpdate', room);
    cb({ ok: true, roomId });
  });

  socket.on('leaveRoom', () => {
    const roomId = socket.data.roomId;
    leaveRoom(socket, roomId);
  });

  socket.on('updateState', (state) => {
    // broadcast position/inputs to other clients in room
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('playerState', { id: socket.id, state });
  });

  socket.on('scoreHit', ({ correct }, cb) => {
    // correct: boolean if player touched correct color
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;
    if (correct) {
      // apply multiplier
      const gained = 1 * (room.multiplier || 1);
      player.score += gained;
      // small multiplier increase per correct hit
      room.multiplier = Math.min(5, (room.multiplier || 1) + 0.1);
    } else {
      player.score = Math.max(0, player.score - 1);
      // penalty to multiplier
      room.multiplier = Math.max(1, (room.multiplier || 1) - 0.2);
    }
    io.to(roomId).emit('roomUpdate', room);
    if (cb) cb({ ok: true, playerScore: player.score, multiplier: room.multiplier });
  });

  socket.on('advanceLevel', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    room.level = (room.level || 1) + 1;
    // increase multiplier slowly when level increases
    room.multiplier = Math.min(5, (room.multiplier || 1) + 0.2);
    io.to(roomId).emit('roomUpdate', room);
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    leaveRoom(socket, roomId);
    console.log('socket disconnected', socket.id);
  });
});

function leaveRoom(socket, roomId){
  if(!roomId) return;
  const room = rooms[roomId];
  if(!room) return;
  delete room.players[socket.id];
  socket.leave(roomId);
  if(Object.keys(room.players).length === 0){
    delete rooms[roomId];
  } else {
    io.to(roomId).emit('roomUpdate', room);
  }
}

server.listen(PORT, () => console.log('Server running on port', PORT));