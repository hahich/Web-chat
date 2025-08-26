import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { getFileUrl, saveBase64Image } from "../lib/localStorage.js";

export const createGroup = async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        const creatorId = req.user._id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "Group name is required" });
        }

        const uniqueMemberIds = Array.from(new Set([...(memberIds || []), creatorId.toString()]));

        // Validate users exist
        const count = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
        if (count !== uniqueMemberIds.length) {
            return res.status(400).json({ message: "One or more members do not exist" });
        }

        const group = await Group.create({
            name: name.trim(),
            createdBy: creatorId,
            members: uniqueMemberIds,
        });

        res.status(201).json(group);
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId })
            .populate("members", "fullName email profilePicture")
            .populate("createdBy", "fullName email profilePicture")
            .sort({ updatedAt: -1 });
        // Ensure profilePicture fields are returned as absolute URLs
        const groupsWithFullUrls = groups.map((g) => {
            const groupObj = g.toObject();
            if (groupObj.members && Array.isArray(groupObj.members)) {
                groupObj.members = groupObj.members.map((m) => ({
                    ...m,
                    profilePicture: m.profilePicture ? getFileUrl(m.profilePicture, req) : null,
                }));
            }
            if (groupObj.createdBy) {
                groupObj.createdBy = {
                    ...groupObj.createdBy,
                    profilePicture: groupObj.createdBy.profilePicture ? getFileUrl(groupObj.createdBy.profilePicture, req) : null,
                };
            }
            return groupObj;
        });

        res.status(200).json({ groups: groupsWithFullUrls });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberIds } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Only creator can add for now
        if (group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Only group creator can add members" });
        }

        const toAdd = Array.from(new Set(memberIds || []));
        const existingSet = new Set(group.members.map((m) => m.toString()));
        const newMembers = toAdd.filter((id) => !existingSet.has(id));

        if (newMembers.length === 0) {
            return res.status(200).json(group);
        }

        // Validate users exist
        const count = await User.countDocuments({ _id: { $in: newMembers } });
        if (count !== newMembers.length) {
            return res.status(400).json({ message: "One or more members do not exist" });
        }

        group.members.push(...newMembers);
        await group.save();

        const populated = await Group.findById(groupId)
            .populate("members", "fullName email profilePicture")
            .populate("createdBy", "fullName email profilePicture");

        res.status(200).json(populated);
    } catch (error) {
        console.error("Error adding members:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        const isMember = group.members.some(m => m.toString() === userId.toString());
        if (!isMember) return res.status(403).json({ message: "Not a member of this group" });

        const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
        const withFullUrl = messages.map(m => ({
            ...m.toObject(),
            image: m.image ? getFileUrl(m.image, req) : null,
        }));
        res.status(200).json({ messages: withFullUrl });
    } catch (error) {
        console.error("Error fetching group messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image } = req.body;
        const senderId = req.user._id;

        const group = await Group.findById(groupId).populate('members', '_id');
        if (!group) return res.status(404).json({ message: "Group not found" });

        const isMember = group.members.some(m => m._id.toString() === senderId.toString());
        if (!isMember) return res.status(403).json({ message: "Not a member of this group" });

        let imageUrl;
        if (image) {
            const uploadRes = await saveBase64Image(image, 'image');
            imageUrl = uploadRes.url;
        }

        const newMessage = new Message({
            text,
            image: imageUrl,
            senderId,
            groupId,
        });
        await newMessage.save();

        const messageWithFullUrl = {
            ...newMessage.toObject(),
            image: newMessage.image ? getFileUrl(newMessage.image, req) : null,
        };

        // Emit to all group members online
        for (const member of group.members) {
            const uid = member._id ? member._id.toString() : member.toString();
            if (uid === senderId.toString()) continue;
            const socketId = getReceiverSocketId(uid);
            if (socketId) io.to(socketId).emit('newGroupMessage', messageWithFullUrl);
        }

        res.status(201).json(messageWithFullUrl);
    } catch (error) {
        console.error("Error sending group message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


