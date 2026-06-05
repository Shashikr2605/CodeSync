// Entry point — creates server, attaches Socket.IO, starts listening
require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const setupSocket = require("./socket");
const { PORT } = require("./config/constants");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});