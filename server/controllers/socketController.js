const { getRoomCode, setRoomCode } = require("../models/roomModel");
const { USER_COLORS } = require("../config/constants");

const socketMeta = {};
const roomColorIndex = {};
const roomLanguage = {};

function getSocketMeta() { return socketMeta; }

function getNextColor(roomId) {
  if (roomColorIndex[roomId] === undefined) roomColorIndex[roomId] = 0;
  const color = USER_COLORS[roomColorIndex[roomId] % USER_COLORS.length];
  roomColorIndex[roomId]++;
  return color;
}

function handleJoinRoom(io, socket, { roomId, username }) {
  socket.join(roomId);

  const color = getNextColor(roomId);
  socketMeta[socket.id] = { roomId, username, color };

  const code = getRoomCode(roomId);
  if (code) socket.emit("receive_code", code);

  if (roomLanguage[roomId]) {
    socket.emit("language:changed", { language: roomLanguage[roomId] });
  }

  socket.emit("assigned_color", { color });

  socket.to(roomId).emit("user_joined", { socketId: socket.id, username, color });

  const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
  const users = clients
    .filter((id) => id !== socket.id && socketMeta[id])
    .map((id) => ({
      socketId: id,
      username: socketMeta[id].username,
      color: socketMeta[id].color,
    }));
  socket.emit("room_users", users);
}

function handleSendCode(socket, { roomId, code }) {
  setRoomCode(roomId, code);
  socket.to(roomId).emit("receive_code", code);
}

function handleCursorMove(socket, { roomId, line, column, selection }) {
  const meta = socketMeta[socket.id];
  if (!meta) return;
  socket.to(roomId).emit("remote_cursor", {
    socketId: socket.id,
    username: meta.username,
    color: meta.color,
    line,
    column,
    selection: selection || null,
  });
}

function handleDisconnect(socket) {
  const meta = socketMeta[socket.id];
  if (meta) {
    socket.to(meta.roomId).emit("user_left", { socketId: socket.id });
    delete socketMeta[socket.id];
  }
  console.log("User disconnected:", socket.id);
}

module.exports = {
  handleJoinRoom,
  handleSendCode,
  handleCursorMove,
  handleDisconnect,
  getSocketMeta,
  roomLanguage,
};