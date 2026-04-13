import express from 'express';
import { registerUser, loginUser, refreshToken, logoutUser, forgotPassword, resetPassword } from '../controllers/usersController.js';

const router = express.Router();

// Rutas de autenticación
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
