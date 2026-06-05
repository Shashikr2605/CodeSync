require("dotenv").config();
const {
  handleJoinRoom,
  handleSendCode,
  handleCursorMove,
  handleDisconnect,
  roomLanguage,
} = require("./controllers/socketController");
const { handleSendMessage, handleGetHistory } = require("./controllers/chatController");
const {
  handleVoiceJoin,
  handleVoiceOffer,
  handleVoiceAnswer,
  handleIceCandidate,
  handleVoiceLeave,
  cleanupVoice,
} = require("./controllers/voiceController");
const { handleRunCode } = require("./controllers/codeController");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (data) => handleJoinRoom(io, socket, data));
    socket.on("send_code", (data) => handleSendCode(socket, data));
    socket.on("cursor_move", (data) => handleCursorMove(socket, data));

    socket.on("language:change", ({ roomId, language }) => {
      roomLanguage[roomId] = language;
      socket.to(roomId).emit("language:changed", { language });
    });

    socket.on("chat:send", (data) => handleSendMessage(io, socket, data));
    socket.on("chat:history", (roomId) => handleGetHistory(socket, roomId));

    socket.on("voice:join", (roomId) => handleVoiceJoin(io, socket, roomId));
    socket.on("voice:offer", (data) => handleVoiceOffer(socket, data));
    socket.on("voice:answer", (data) => handleVoiceAnswer(socket, data));
    socket.on("voice:ice-candidate", (data) => handleIceCandidate(socket, data));
    socket.on("voice:leave", (roomId) => handleVoiceLeave(io, socket, roomId));

    socket.on("code:run", (data) => handleRunCode(socket, data));

    socket.on("disconnect", () => {
      cleanupVoice(io, socket);
      handleDisconnect(socket);
    });
  });
};