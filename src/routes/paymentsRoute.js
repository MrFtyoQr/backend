import express from 'express';
import { 
    createPayment,
    confirmPayment, 
    getPaymentHistory, 
    getSubscriptionInfo, 
    cancelSubscription,
    stripeWebhook 
} from '../controllers/paymentsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Webhook de Stripe (sin autenticación)
router.post('/webhook/stripe', stripeWebhook);

// Todas las demás rutas requieren autenticación
router.use(authenticateToken);

// Rutas de pagos
router.post('/create', createPayment);
router.post('/confirm', confirmPayment);
router.get('/history', getPaymentHistory);
router.get('/subscription', getSubscriptionInfo);
router.post('/cancel', cancelSubscription);

export default router;
