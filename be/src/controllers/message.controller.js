import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { saveBase64Image, getFileUrl, deleteLocalFile } from "../lib/localStorage.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        // Add full URLs to profile pictures
        const usersWithFullUrls = filteredUsers.map(user => ({
            ...user.toObject(),
            profilePicture: user.profilePicture ? getFileUrl(user.profilePicture, req) : null
        }));

        res.status(200).json({
            users: usersWithFullUrls,
        });
    } catch (error) {
        console.error("Error fetching user for sidebar:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        });

        // Add full URLs to images
        const messagesWithFullUrls = messages.map(message => ({
            ...message.toObject(),
            image: message.image ? getFileUrl(message.image, req) : null
        }));

        res.status(200).json(messagesWithFullUrls);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            // Save base64 image locally
            const uploadRes = await saveBase64Image(image, 'image');
            imageUrl = uploadRes.url;
        }

        const newMessage = new Message({
            text,
            image: imageUrl,
            senderId,
            receiverId
        });

        await newMessage.save();

        // Add full URL to the response
        const messageWithFullUrl = {
            ...newMessage.toObject(),
            image: newMessage.image ? getFileUrl(newMessage.image, req) : null
        };

        // realtime function 
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", messageWithFullUrl);
        }
        res.status(201).json(messageWithFullUrl);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        if (!emoji) {
            return res.status(400).json({ message: "Emoji is required" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
            reaction => reaction.userId.toString() === userId.toString() && reaction.emoji === emoji
        );

        if (existingReaction) {
            // Remove reaction if already exists
            message.reactions = message.reactions.filter(
                reaction => !(reaction.userId.toString() === userId.toString() && reaction.emoji === emoji)
            );
        } else {
            // Add new reaction
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        // Get updated message with full URLs
        const updatedMessage = await Message.findById(messageId).populate('reactions.userId', 'fullName profilePicture');
        const messageWithFullUrl = {
            ...updatedMessage.toObject(),
            image: updatedMessage.image ? getFileUrl(updatedMessage.image, req) : null
        };

        // Emit to both sender and receiver
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        const senderSocketId = getReceiverSocketId(message.senderId.toString());

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageReaction", messageWithFullUrl);
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageReaction", messageWithFullUrl);
        }

        res.status(200).json(messageWithFullUrl);
    } catch (error) {
        console.error("Error adding reaction:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: "Message text is required" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user owns the message
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only edit your own messages" });
        }

        message.text = text.trim();
        message.isEdited = true;
        message.editedAt = new Date();

        await message.save();

        // Get updated message with full URLs
        const messageWithFullUrl = {
            ...message.toObject(),
            image: message.image ? getFileUrl(message.image, req) : null
        };

        // Emit to receiver
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageEdited", messageWithFullUrl);
        }

        res.status(200).json(messageWithFullUrl);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user owns the message
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only delete your own messages" });
        }

        // Delete image if exists
        if (message.image && message.image.startsWith('/uploads/')) {
            deleteLocalFile(message.image);
        }

        await Message.findByIdAndDelete(messageId);

        // Emit to receiver
        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", { messageId });
        }

        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const searchMessages = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user._id;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Search in messages where user is sender or receiver
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                },
                {
                    $or: [
                        { text: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        })
        .populate('senderId', 'fullName profilePicture')
        .populate('receiverId', 'fullName profilePicture')
        .sort({ createdAt: -1 })
        .limit(50);

        // Add full URLs to messages and populated users' profile pictures
        const messagesWithFullUrls = messages.map((message) => {
            const msg = message.toObject();

            // Normalize message image
            msg.image = msg.image ? getFileUrl(msg.image, req) : null;

            // Normalize sender/receiver profile pictures (populated docs)
            if (msg.senderId && typeof msg.senderId === 'object' && msg.senderId.profilePicture) {
                msg.senderId.profilePicture = getFileUrl(msg.senderId.profilePicture, req);
            }
            if (msg.receiverId && typeof msg.receiverId === 'object' && msg.receiverId.profilePicture) {
                msg.receiverId.profilePicture = getFileUrl(msg.receiverId.profilePicture, req);
            }

            return msg;
        });

        res.status(200).json({ messages: messagesWithFullUrls });
    } catch (error) {
        console.error("Error searching messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}