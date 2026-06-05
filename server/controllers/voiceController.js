// Controller: WebRTC voice chat signaling
// Tracks which sockets are in voice per room: roomId -> Set<socketId>
const voiceRooms = new Map();

function handleVoiceJoin(io, socket, roomId) {
  if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Set());
  voiceRooms.get(roomId).add(socket.id);

  // Tell existing voice participants a new peer joined (so they initiate offers)
  socket.to(roomId).emit("voice:user-joined", { socketId: socket.id });

  // Send the new joiner the current voice participant list
  const participants = Array.from(voiceRooms.get(roomId)).filter(
    (id) => id !== socket.id
  );
  socket.emit("voice:participants", participants);

  console.log(`[Voice] ${socket.id} joined voice in room ${roomId}`);
}

function handleVoiceOffer(socket, { targetId, offer }) {
  socket.to(targetId).emit("voice:offer", {
    fromId: socket.id,
    offer,
  });
}

function handleVoiceAnswer(socket, { targetId, answer }) {
  socket.to(targetId).emit("voice:answer", {
    fromId: socket.id,
    answer,
  });
}

function handleIceCandidate(socket, { targetId, candidate }) {
  socket.to(targetId).emit("voice:ice-candidate", {
    fromId: socket.id,
    candidate,
  });
}

function handleVoiceLeave(io, socket, roomId) {
  if (voiceRooms.has(roomId)) {
    voiceRooms.get(roomId).delete(socket.id);
    if (voiceRooms.get(roomId).size === 0) voiceRooms.delete(roomId);
  }
  socket.to(roomId).emit("voice:user-left", { socketId: socket.id });
  console.log(`[Voice] ${socket.id} left voice in room ${roomId}`);
}

// Called on disconnect to clean up voice state
function cleanupVoice(io, socket) {
  voiceRooms.forEach((members, roomId) => {
    if (members.has(socket.id)) {
      handleVoiceLeave(io, socket, roomId);
    }
  });
}

module.exports = {
  handleVoiceJoin,
  handleVoiceOffer,
  handleVoiceAnswer,
  handleIceCandidate,
  handleVoiceLeave,
  cleanupVoice,
};
