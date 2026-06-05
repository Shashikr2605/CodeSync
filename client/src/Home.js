import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (!roomId.trim() || !username.trim()) {
      alert("Enter both your name and a room ID");
      return;
    }
    // Save username to sessionStorage so EditorPage can read it
    sessionStorage.setItem("username", username.trim());
    navigate(`/room/${roomId.trim()}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "100px", gap: "16px" }}>
      <h1>Collaborative Editor</h1>
      <input
        placeholder="Your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && joinRoom()}
        style={inputStyle}
      />
      <button onClick={joinRoom} style={btnStyle}>Join Room</button>
    </div>
  );
}

const inputStyle = {
  padding: "10px 16px", fontSize: "16px",
  borderRadius: "8px", border: "1px solid #555",
  background: "#1e1e1e", color: "#fff", width: "280px"
};

const btnStyle = {
  padding: "10px 32px", fontSize: "16px",
  borderRadius: "8px", background: "#534AB7",
  color: "#fff", border: "none", cursor: "pointer"
};

export default Home;