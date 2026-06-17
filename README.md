# CodeSync — Real-time Collaborative Code Editor

A real-time collaborative code editor with **Text Chat**, **Voice Chat (WebRTC)**, and **Multi-language Code Execution** built with React, Node.js, Express, and Socket.IO.

## 🌐 Live Demo
**[https://codesync-clients.onrender.com](https://codesync-clients.onrender.com)**

---

## ✨ Features

- 🔴 **Real-time code sync** — changes broadcast instantly to all room members
- 👥 **Multi-user cursors** — see where each collaborator's cursor is live
- 🎨 **Syntax highlighting** — Monaco Editor with a warm dark theme
- 🌐 **Language switcher** — JavaScript, Python, Java, C++, C
- 💬 **Text Chat** — room-scoped chat with message history (last 50 messages)
- 🎙 **Voice Chat** — WebRTC peer-to-peer audio with speaking detection indicators
- ▶ **Run Code** — execute code with stdin support via self-hosted Judge0
- 📥 **Stdin Input** — pass custom input to programs that use `input()` / `scanf`

---

## ⚙️ Code Execution

CodeSync runs a **self-hosted Judge0 instance via Docker** — both locally and in production on Render.

### Architecture

```
Judge0 (Docker)
├── judge0/judge0:1.13.0   — API server (port 2358) + worker containers
├── postgres:13            — submission database
└── redis:6                — job queue
```

Judge0 spins up an **isolated container per code submission** — fully sandboxed, no shared state between runs.

### Three-Provider Fallback (if Judge0 is unavailable)

If Judge0 is down or unreachable, the server automatically falls back:

| Priority | Provider | Description |
|---|---|---|
| 1st | **Piston** | emkc.org — free, no auth |
| 2nd | **Wandbox** | wandbox.org — free, many compilers |
| 3rd | **Codex** | api.codex.jaagrav.in — free fallback |

### Supported Languages

| Language | Runtime |
|---|---|
| Python | CPython 3.12 |
| JavaScript | Node.js 20 |
| Java | OpenJDK 22 |
| C++ | GCC 13 |
| C | GCC 13 |

---

## 🌍 Production Deployment (Render)

Three services deployed on Render:

| Service | Runtime | Role |
|---|---|---|
| `CodeSync` | **Docker** | Self-hosted Judge0 execution engine |
| `CodeSync-servers` | Node | Express + Socket.IO backend |
| `CodeSync-clients` | Static | React frontend |

All services auto-deploy on every push to `main`.

---

## 🏗 Project Structure (MVC)

```
CodeSync/
├── client/                              # React frontend
│   └── src/
│       ├── config/
│       │   └── editorConfig.js          # Monaco WARM_THEME, STARTER_CODE
│       ├── utils/
│       │   └── helpers.js               # generateId(), getInitials()
│       ├── services/
│       │   └── socketService.js         # Socket.IO connection factory
│       ├── hooks/
│       │   ├── useSocket.js             # Socket events & state management
│       │   ├── useCodeRunner.js         # Code execution with stdin support
│       │   ├── useChat.js               # Chat state & events
│       │   ├── useVoiceChat.js          # WebRTC voice logic
│       │   └── useEditorDecorations.js  # Monaco remote cursor decorations
│       ├── components/
│       │   ├── TopBar.js
│       │   ├── CursorPanel.js
│       │   ├── CursorLabel.js
│       │   ├── StatusBar.js
│       │   ├── Chat/ChatPanel.js
│       │   ├── Output/OutputPanel.js    # Output + stdin input box
│       │   ├── Toolbar/RunButton.js
│       │   └── VoiceChat/VoicePanel.js
│       ├── pages/
│       │   ├── JoinPage.js
│       │   └── EditorPage.js
│       ├── App.js
│       ├── App.css
│       └── index.js
│
└── server/                              # Node.js backend
    ├── config/
    │   └── constants.js
    ├── models/
    │   └── roomModel.js
    ├── controllers/
    │   ├── socketController.js
    │   ├── codeController.js            # Judge0 + fallback chain
    │   ├── chatController.js
    │   └── voiceController.js
    ├── routes/
    │   └── healthRoutes.js
    ├── middleware/
    │   └── errorHandler.js
    ├── docker-compose.yml               # Judge0 + PostgreSQL + Redis
    ├── app.js
    ├── socket.js
    └── index.js
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v16+
- npm
- Docker + Docker Compose

### 1. Start Judge0 via Docker

```bash
cd server
docker-compose up -d
```

Wait ~30 seconds, then verify Judge0 is running:
```
http://localhost:2358/system_info
```

### 2. Environment Variables

Create `server/.env`:
```env
PORT=5000
JUDGE0_URL=http://localhost:2358
```

### 3. Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 4. Run the App

```bash
# Terminal 1 — backend
cd server && node index.js

# Terminal 2 — frontend
cd client && npm start
```

App runs at **http://localhost:3000**

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a room with username |
| `send_code` | Client → Server | Broadcast code change |
| `cursor_move` | Client → Server | Broadcast cursor position |
| `code:run` | Client → Server | Execute code with stdin |
| `code:output` | Server → Client | Execution result (stdout/stderr) |
| `code:error` | Server → Client | Execution error message |
| `receive_code` | Server → Client | Synced code from server |
| `remote_cursor` | Server → Client | Remote cursor position |
| `user_joined` | Server → Client | New user notification |
| `user_left` | Server → Client | User disconnected notification |
| `room_users` | Server → Client | List of room members |
| `assigned_color` | Server → Client | User's assigned cursor color |

---

## 🌐 Browser Support

Voice Chat (WebRTC) requires HTTPS in production and a modern browser:
- ✅ Chrome 74+, Firefox 70+, Edge 79+, Safari 14.1+
- ❌ Not supported over plain HTTP (except localhost)

---

## 📄 License

MIT