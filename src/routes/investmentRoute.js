import express from 'express';
import { 
    getInvestmentAnalysis, 
    getPersonalizedRecommendation, 
    getUserPortfolio, 
    setInvestmentAlert, 
    getMarketTrends 
} from '../controllers/investmentController.js';
import { authenticateToken, requirePremium } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de inversiones
router.get('/analysis', getInvestmentAnalysis);
router.post('/recommend', requirePremium, getPersonalizedRecommendation);
router.get('/portfolio', getUserPortfolio);
router.post('/alert', setInvestmentAlert);
router.get('/trends', getMarketTrends);

export default router;
