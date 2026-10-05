import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    auth: (callback) => callback({ token: localStorage.getItem("token") || "" }),
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
});

export default socket;
