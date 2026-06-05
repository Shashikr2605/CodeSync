// Model: in-memory room state
const rooms = {};

function getRoomCode(roomId) {
  return rooms[roomId] || "";
}

function setRoomCode(roomId, code) {
  rooms[roomId] = code;
}

module.exports = { getRoomCode, setRoomCode };
