import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createGroup, getMyGroups, addMembers, getGroupMessages, sendGroupMessage } from '../controllers/group.controller.js';

const router = express.Router();

router.get('/', protectRoute, getMyGroups);
router.post('/', protectRoute, createGroup);
router.post('/:groupId/members', protectRoute, addMembers);
router.get('/:groupId/messages', protectRoute, getGroupMessages);
router.post('/:groupId/messages', protectRoute, sendGroupMessage);

export default router;


