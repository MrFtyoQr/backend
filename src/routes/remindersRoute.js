import express from 'express';
import { 
    createReminder, 
    getUserReminders, 
    getUpcomingReminders, 
    completeReminder, 
    updateReminder, 
    deleteReminder, 
    getRemindersForNotification, 
    getRemindersSummary 
} from '../controllers/remindersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de recordatorios
router.post('/', createReminder);
router.get('/', getUserReminders);
router.get('/upcoming', getUpcomingReminders);
router.put('/:id/complete', completeReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);
router.get('/notifications', getRemindersForNotification);
router.get('/summary', getRemindersSummary);

export default router;
