import express from 'express';
import { getCryptoData, getStocksData, getMarketAnalysis, getPersonalizedAnalysis } from '../controllers/marketController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de mercado
router.get('/crypto', getCryptoData);
router.get('/stocks', getStocksData);
router.get('/analysis', getMarketAnalysis);
router.get('/personalized-analysis', getPersonalizedAnalysis);

export default router;
