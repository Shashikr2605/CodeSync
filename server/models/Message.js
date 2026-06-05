// Model: in-memory message store
// Schema: { id, roomId, userId, username, text, timestamp }

const messages = new Map(); // roomId -> Message[]
const MAX_HISTORY = 50;

function createMessage({ roomId, userId, username, text }) {
  return {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    roomId,
    userId,
    username,
    text,
    timestamp: new Date().toISOString(),
  };
}

function addMessage(msg) {
  if (!messages.has(msg.roomId)) messages.set(msg.roomId, []);
  const list = messages.get(msg.roomId);
  list.push(msg);
  if (list.length > MAX_HISTORY) list.shift();
}

function getHistory(roomId) {
  return messages.get(roomId) || [];
}

module.exports = { createMessage, addMessage, getHistory };
