// Monaco editor theme and starter code constants
export const WARM_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword",    foreground: "E8863A", fontStyle: "bold" },
    { token: "string",     foreground: "82C98A" },
    { token: "number",     foreground: "A9D0F5" },
    { token: "comment",    foreground: "6B5040", fontStyle: "italic" },
    { token: "variable",   foreground: "C4A0E8" },
    { token: "type",       foreground: "F0C070" },
    { token: "function",   foreground: "F0C070" },
    { token: "identifier", foreground: "F5E6D0" },
    { token: "delimiter",  foreground: "8A6E52" },
    { token: "operator",   foreground: "E8863A" },
  ],
  colors: {
    "editor.background":                   "#1A120B",
    "editor.foreground":                   "#F5E6D0",
    "editorLineNumber.foreground":         "#4A3020",
    "editorLineNumber.activeForeground":   "#E8863A",
    "editor.lineHighlightBackground":      "#221810",
    "editor.selectionBackground":          "#E8863A44",
    "editor.inactiveSelectionBackground":  "#E8863A22",
    "editorCursor.foreground":             "#E8863A",
    "editorWhitespace.foreground":         "#2C1F14",
    "editor.findMatchBackground":          "#E8863A55",
    "editor.findMatchHighlightBackground": "#E8863A33",
    "scrollbar.shadow":                    "#00000000",
    "scrollbarSlider.background":          "#3D2B1F88",
    "scrollbarSlider.hoverBackground":     "#4A3425AA",
    "editorGutter.background":             "#160F08",
    "editorWidget.background":             "#221810",
    "editorWidget.border":                 "#E8863A44",
    "input.background":                    "#2C1F14",
    "input.foreground":                    "#F5E6D0",
    "input.border":                        "#E8863A44",
    "focusBorder":                         "#E8863A",
  },
};

export const STARTER_CODE = `// Welcome to CodeSync — Real-time Collaborative Editor
// Share your Room ID with teammates to code together!

const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_code", ({ roomId, code }) => {
    socket.to(roomId).emit("receive_code", code);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server on port 5000"));
`;
