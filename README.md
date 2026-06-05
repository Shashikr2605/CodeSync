# CodeSync — Real-time Collaborative Code Editor

A real-time collaborative code editor with **Text Chat**, **Voice Chat (WebRTC)**, and **Code Execution (Judge0)** built with React, Node.js, Express, and Socket.IO.

## Features

- 🔴 **Real-time code sync** — changes broadcast instantly to all room members
- 👥 **Multi-user cursors** — see where each collaborator's cursor is live
- 🎨 **Syntax highlighting** — Monaco Editor with a warm dark theme
- 🌐 **Language switcher** — JavaScript, TypeScript, Python, C++, Java, JSON, CSS, HTML
- 💬 **Text Chat** — room-scoped chat with message history (last 50 messages)
- 🎙 **Voice Chat** — WebRTC peer-to-peer audio with speaking detection indicators
- ▶ **Run Code** — execute code via Judge0 API (JS, Python, Java, C++, C) with stdout/stderr output

---

## Project Structure (MVC)

```
CodeSync/
├── client/                         # React frontend
│   └── src/
│       ├── config/                 # [Config] Constants & editor theme
│       │   └── editorConfig.js     # Monaco WARM_THEME, STARTER_CODE
│       ├── utils/                  # [Utility] Pure helper functions
│       │   └── helpers.js          # generateId(), getInitials()
│       ├── services/               # [Model] External communication
│       │   └── socketService.js    # Socket.IO connection factory
│       ├── hooks/                  # [Controller] Business logic as hooks
│       │   ├── useSocket.js        # Manages all socket events & state
│       │   └── useEditorDecorations.js  # Monaco remote cursor decorations
│       ├── components/             # [View] Reusable UI components
│       │   ├── TopBar.js           # Header: room pill, language, users
│       │   ├── CursorPanel.js      # Live cursor position chips
│       │   ├── CursorLabel.js      # Floating name tag over remote cursors
│       │   └── StatusBar.js        # Footer: language, live indicator
│       ├── pages/                  # [View] Full page components
│       │   ├── JoinPage.js         # Join / create room screen
│       │   └── EditorPage.js       # Main editor screen (assembles components)
│       ├── App.js                  # Root: state, hooks wiring, page routing
│       ├── App.css                 # Global styles & theme
│       └── index.js                # React entry point
│
└── server/                         # Node.js backend
    ├── config/
    │   └── constants.js            # [Config] PORT, USER_COLORS palette
    ├── models/
    │   └── roomModel.js            # [Model] In-memory room code store
    ├── controllers/
    │   └── socketController.js     # [Controller] All socket event handlers
    ├── routes/
    │   └── healthRoutes.js         # [Route] GET /api/health
    ├── middleware/
    │   └── errorHandler.js         # [Middleware] Centralized error handler
    ├── app.js                      # Express app factory (middleware + routes)
    ├── socket.js                   # Socket.IO setup — delegates to controller
    └── index.js                    # Entry point: creates server, starts listening
```

---

## MVC Role of Each Folder

### Server

| Folder/File | MVC Role | Responsibility |
|---|---|---|
| `config/` | Config | Environment constants, color palette |
| `models/` | **Model** | In-memory room data (`getRoomCode`, `setRoomCode`) |
| `controllers/` | **Controller** | Socket event logic: join, code sync, cursor, disconnect |
| `routes/` | Router | HTTP route definitions (health check) |
| `middleware/` | Middleware | Error handling, (future: auth) |
| `app.js` | App Factory | Wires Express middleware and routes |
| `socket.js` | Socket Setup | Initializes Socket.IO, delegates events to controller |
| `index.js` | Entry Point | Creates HTTP server, attaches socket, listens on PORT |

### Client

| Folder | MVC Role | Responsibility |
|---|---|---|
| `services/` | **Model** | Socket connection factory, server communication |
| `hooks/` | **Controller** | Business logic: socket state, editor decorations |
| `pages/` | **View** | Full page layouts (`JoinPage`, `EditorPage`) |
| `components/` | **View** | Reusable UI pieces (`TopBar`, `CursorPanel`, etc.) |
| `config/` | Config | Monaco theme, starter code, constants |
| `utils/` | Utility | Pure functions (`generateId`, `getInitials`) |
| `App.js` | Orchestrator | State, hook wiring, routing between pages |

---

## Setup & Run

### Prerequisites
- Node.js v16+
- npm
- A free RapidAPI key for Judge0 CE (see below)

### Environment Variables

Create `server/.env` (already created — just fill in your key):

```env
PORT=5000
JUDGE0_API_KEY=your_rapidapi_key_here
```

> **Getting a Judge0 API Key:** Sign up free at [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce). The free tier allows ~50 submissions/day.

### Install Dependencies

```bash
# From root
cd server && npm install
cd ../client && npm install
```

### Run the Server

```bash
cd server
node index.js
# Server running on port 5000
```

### Run the Client

```bash
cd client
npm start
# App running on http://localhost:3000
```

### Run Both Together (from root)

```bash
npm run dev
```

---

## Browser Support Notes

> **Voice Chat (WebRTC)** requires a modern browser with `getUserMedia` support:
> - ✅ Chrome 74+, Firefox 70+, Edge 79+, Safari 14.1+
> - ❌ Not supported in HTTP (non-localhost) without HTTPS — deploy with SSL for production.

> **Judge0 Free Tier Limits:**
> - ~50 code executions per day on the free RapidAPI plan
> - Max 5 seconds execution time per submission
> - Upgrade at [judge0-ce.p.rapidapi.com](https://rapidapi.com/judge0-official/api/judge0-ce) for higher limits

---


## Features

- 🔴 **Real-time code sync** — changes broadcast instantly to all room members
- 👥 **Multi-user cursors** — see where each collaborator's cursor is live
- 🎨 **Syntax highlighting** — Monaco Editor with a warm dark theme
- 🌐 **Language switcher** — JavaScript, TypeScript, Python, C++, Java, JSON, CSS, HTML
- 🟢 **Room management** — create or join rooms with a shareable Room ID

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a room with username |
| `send_code` | Client → Server | Broadcast code change |
| `cursor_move` | Client → Server | Broadcast cursor position |
| `receive_code` | Server → Client | Receive synced code |
| `remote_cursor` | Server → Client | Receive remote cursor position |
| `user_joined` | Server → Client | New user joined notification |
| `user_left` | Server → Client | User disconnected notification |
| `room_users` | Server → Client | List of existing room members |
| `assigned_color` | Server → Client | User's assigned color |
