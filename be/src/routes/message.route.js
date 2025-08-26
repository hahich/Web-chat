import express from 'express';
import { getMessages, getUserForSidebar, sendMessage, addReaction, editMessage, deleteMessage, searchMessages } from '../controllers/message.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
 
const router = express.Router();

router.get('/users', protectRoute, getUserForSidebar);
router.get('/user/:id', protectRoute, getMessages);
router.get('/search', protectRoute, searchMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/reaction/:messageId", protectRoute, addReaction);
router.put("/edit/:messageId", protectRoute, editMessage);
router.delete("/delete/:messageId", protectRoute, deleteMessage);

export default router;