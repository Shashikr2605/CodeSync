import React, { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const socket = io("http://localhost:5000");

function EditorPage() {
  const { id } = useParams();

  const [code, setCode] = useState("");
  const [cursors, setCursors] = useState({});
  const [username, setUsername] = useState("");

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // 🔹 Ask username once
  useEffect(() => {
    const name = prompt("Enter your username:");
    setUsername(name || "Anonymous");

    socket.emit("join_room", {
      room: id,
      username: name || "Anonymous",
    });
  }, [id]);

  // 🔹 Receive code
  useEffect(() => {
    socket.on("receive_code", (newCode) => {
      if (typeof newCode === "string") {
        setCode(newCode);
      }
    });

    return () => socket.off("receive_code");
  }, []);

  // 🔹 Handle typing
  const handleChange = (value) => {
    if (typeof value !== "string") return;

    setCode(value);

    socket.emit("send_code", value, id);
  };

  // 🔹 Track cursor movement
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    const disposable = editor.onDidChangeCursorPosition((e) => {
      socket.emit("cursor_move", {
        room: id,
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    return () => disposable.dispose();
  }, [id]);

  // 🔹 Receive cursor updates
  useEffect(() => {
    socket.on("cursor_update", (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.socketId]: data,
      }));
    });

    socket.on("cursor_remove", (socketId) => {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    return () => {
      socket.off("cursor_update");
      socket.off("cursor_remove");
    };
  }, []);

  // 🔹 Render cursors
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const decorations = Object.values(cursors).map((cursor) => ({
      range: new monaco.Range(
        cursor.line,
        cursor.column,
        cursor.line,
        cursor.column
      ),
      options: {
        className: "remote-cursor",
        after: {
          content: ` ${cursor.username}`,
          inlineClassName: "cursor-label",
        },
      },
    }));

    editor.deltaDecorations([], decorations);
  }, [cursors]);

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>
        Room: {id} | User: {username}
      </h2>

      <Editor
        height="90vh"
        defaultLanguage="javascript"
        value={code}
        onChange={handleChange}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
        }}
        theme="vs-dark"
      />
    </div>
  );
}

export default EditorPage;