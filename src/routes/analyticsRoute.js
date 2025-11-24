import express from 'express';
import { 
    getDashboard, 
    getTrends, 
    getCategoryAnalysis, 
    getPredictions, 
    getMonthlyReport 
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de analytics
router.get('/dashboard', getDashboard);
router.get('/trends', getTrends);
router.get('/categories', getCategoryAnalysis);
router.get('/predictions', getPredictions);
router.get('/monthly-report', getMonthlyReport);

export default router;
