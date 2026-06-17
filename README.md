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
- ▶ **Run Code** — execute code with stdin support
- 📥 **Stdin Input** — pass custom input to programs that use `input()` / `scanf`

---

## ⚙️ Code Execution

CodeSync supports two execution modes:

### 🖥 Local Development — Judge0 via Docker
Runs a self-hosted [Judge0](https://github.com/judge0/judge0) instance locally using Docker Compose with PostgreSQL and Redis.

```
Docker Compose
├── judge0/judge0:1.13.0   — API server (port 2358) + workers
├── postgres:13            — submission database
└── redis:6                — job queue
```

Set in `server/.env`:
```env
PORT=5000
JUDGE0_URL=http://localhost:2358
```

### 🌍 Production (Render) — Free API Fallback Chain
Since Docker is not available on Render's free tier, the live site uses a three-provider fallback chain — no API key or infrastructure required:

| Priority | Provider | URL |
|---|---|---|
| 1st | **Piston** | emkc.org/api/v2/piston |
| 2nd | **Wandbox** | wandbox.org |
| 3rd | **Codex** | api.codex.jaagrav.in |

If one provider fails, the next is tried automatically. All support **stdin input**.

### Supported Languages

| Language | Runtime |
|---|---|
| Python | CPython 3.12 |
| JavaScript | Node.js 20 |
| Java | OpenJDK 22 |
| C++ | GCC 13 |
| C | GCC 13 |

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
    │   ├── codeController.js            # Multi-provider execution engine
    │   ├── chatController.js
    │   └── voiceController.js
    ├── routes/
    │   └── healthRoutes.js
    ├── middleware/
    │   └── errorHandler.js
    ├── docker-compose.yml               # Local Judge0 setup
    ├── app.js
    ├── socket.js
    └── index.js
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v16+
- npm
- Docker + Docker Compose (for local code execution)

### 1. Start Judge0 via Docker

```bash
cd server
docker-compose up -d
```

Wait ~30 seconds for Judge0 to initialize, then verify:
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
# Terminal 1
cd server && node index.js

# Terminal 2
cd client && npm start
```

App runs at **http://localhost:3000**

---

## 🌍 Deployment (Render — Free Tier)

### Backend — Web Service
| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Environment Variable | `PORT=5000` |

### Frontend — Static Site
| Setting | Value |
|---|---|
| Root Directory | `client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `build` |
| Environment Variable | `REACT_APP_SERVER_URL=https://your-server.onrender.com` |

> On Render, code execution automatically falls back to Piston → Wandbox → Codex since Docker is unavailable on the free tier.

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