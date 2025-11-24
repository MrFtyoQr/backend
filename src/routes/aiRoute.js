import express from 'express';
import { chatWithAI, getConversations, getConversationById, getFinancialAnalysis } from '../controllers/aiController.js';
import { authenticateToken, checkAIUsage } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de IA
router.post('/chat', checkAIUsage, chatWithAI);
router.get('/conversations', getConversations);
router.get('/conversations/:conversationId', getConversationById);
router.get('/analysis', checkAIUsage, getFinancialAnalysis);

export default router;
