import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

const userSocketMap = {};
const typingUsers = new Map(); // Track typing users

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Typing indicators
    socket.on("typing", ({ receiverId, isTyping }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("userTyping", {
                userId,
                isTyping
            });
        }
    });

    // Stop typing
    socket.on("stopTyping", ({ receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("userStopTyping", {
                userId
            });
        }
    });

    // Message reactions
    socket.on("messageReaction", ({ messageId, emoji }) => {
        // This will be handled by the API
    });

    // Message editing
    socket.on("messageEdit", ({ messageId, text }) => {
        // This will be handled by the API
    });

    // Message deletion
    socket.on("messageDelete", ({ messageId }) => {
        // This will be handled by the API
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

export { io, server, app };