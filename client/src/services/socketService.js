import { io } from "socket.io-client";

export const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SERVER_URL, { autoConnect: true });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};