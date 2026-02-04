import express from 'express';
import { createUser, getUserById, getUsers, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/users', getUsers);
router.get('/user/:id', getUserById);
router.post('/user', createUser);
router.put('/user/:id', updateUser);
router.patch('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);

export default router;