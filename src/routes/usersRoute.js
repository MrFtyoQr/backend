import express from 'express';
import { getUserProfile, upgradeSubscription, getAIUsage } from '../controllers/usersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de usuarios
router.get('/profile', getUserProfile);
router.put('/subscription', upgradeSubscription);
router.get('/usage', getAIUsage);

export default router;
