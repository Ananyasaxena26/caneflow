require("dotenv").config();

const http = require("http");

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");

const connectDB = require("./config/db");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {

    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: false,
    },

    cors: {

        origin: "http://localhost:3000",

        methods: ["GET", "POST"]

    }

});

app.set("io", io);

io.use((socket, next) => {
    try {
        const raw = socket.handshake.auth?.token || "";
        const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
        if (!token) return next(new Error("Authentication required"));
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {

    console.log("User Connected :", socket.id);

    socket.on("disconnect", (reason) => {

        console.log("User Disconnected :", socket.id, reason);

    });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});
