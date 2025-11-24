import express from 'express';
import { 
    createGoal, 
    getUserGoals, 
    updateGoalProgress, 
    getSavingsPlan, 
    updateGoalStatus, 
    deleteGoal, 
    getGoalsSummary 
} from '../controllers/goalsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de metas
router.post('/', createGoal);
router.get('/', getUserGoals);
router.put('/:id/progress', updateGoalProgress);
router.get('/:id/plan', getSavingsPlan);
router.put('/:id/status', updateGoalStatus);
router.delete('/:id', deleteGoal);
router.get('/summary', getGoalsSummary);

export default router;
