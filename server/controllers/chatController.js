// Controller: text chat events
const { createMessage, addMessage, getHistory } = require("../models/Message");

function handleSendMessage(io, socket, { roomId, text }) {
  if (!text || !text.trim()) return;

  const socketMeta = require("./socketController").getSocketMeta();
  const meta = socketMeta[socket.id];
  if (!meta) return;

  const msg = createMessage({
    roomId,
    userId:   socket.id,
    username: meta.username,
    text:     text.trim(),
  });

  addMessage(msg);
  io.to(roomId).emit("chat:receive", msg);
}

function handleGetHistory(socket, roomId) {
  const history = getHistory(roomId);
  socket.emit("chat:history", history);
}

module.exports = { handleSendMessage, handleGetHistory };
