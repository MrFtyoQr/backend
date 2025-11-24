import { pool } from '../config/db.js';

// Crear recordatorio
export async function createReminder(req, res) {
    try {
        const { title, description, amount, due_date, reminder_days = 3, is_recurring = false, recurrence_type } = req.body;
        const userId = req.user.userId;

        if (!title || !due_date) {
            return res.status(400).json({
                success: false,
                message: 'Título y fecha de vencimiento son requeridos'
            });
        }

        // Validar fecha
        const dueDate = new Date(due_date);
        if (dueDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de vencimiento debe ser futura'
            });
        }

        // Validar recurrencia
        if (is_recurring && !['monthly', 'yearly'].includes(recurrence_type)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de recurrencia inválido'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO reminders (user_id, title, description, amount, due_date, reminder_days, is_recurring, recurrence_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, description, amount, due_date, reminder_days, is_recurring, recurrence_type]
        );

        // Obtener el recordatorio creado
        const [reminder] = await pool.execute(
            'SELECT * FROM reminders WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Recordatorio creado exitosamente',
            data: { reminder: reminder[0] }
        });

    } catch (error) {
        console.log('Error creando recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener recordatorios del usuario
export async function getUserReminders(req, res) {
    try {
        const userId = req.user.userId;
        const { status } = req.query;

        let query = 'SELECT * FROM reminders WHERE user_id = ?';
        let params = [userId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY due_date ASC';

        const [reminders] = await pool.execute(query, params);

        // Calcular días restantes y estado
        const remindersWithStatus = reminders.map(reminder => {
            const dueDate = new Date(reminder.due_date);
            const today = new Date();
            const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            let currentStatus = reminder.status;
            if (reminder.status === 'pending' && daysRemaining < 0) {
                currentStatus = 'overdue';
            }

            return {
                ...reminder,
                daysRemaining,
                isOverdue: daysRemaining < 0,
                shouldNotify: daysRemaining <= reminder.reminder_days && daysRemaining >= 0
            };
        });

        res.status(200).json({
            success: true,
            data: { reminders: remindersWithStatus }
        });

    } catch (error) {
        console.log('Error obteniendo recordatorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener recordatorios próximos a vencer
export async function getUpcomingReminders(req, res) {
    try {
        const userId = req.user.userId;
        const { days = 7 } = req.query;

        const [reminders] = await pool.execute(`
            SELECT * FROM reminders 
            WHERE user_id = ? 
            AND status = 'pending' 
            AND due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
            ORDER BY due_date ASC
        `, [userId, days]);

        // Calcular días restantes
        const remindersWithDays = reminders.map(reminder => {
            const dueDate = new Date(reminder.due_date);
            const today = new Date();
            const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            return {
                ...reminder,
                daysRemaining,
                shouldNotify: daysRemaining <= reminder.reminder_days
            };
        });

        res.status(200).json({
            success: true,
            data: { reminders: remindersWithDays }
        });

    } catch (error) {
        console.log('Error obteniendo recordatorios próximos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Marcar recordatorio como completado
export async function completeReminder(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verificar que el recordatorio pertenece al usuario
        const [reminders] = await pool.execute(
            'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (reminders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recordatorio no encontrado'
            });
        }

        const reminder = reminders[0];

        // Si es recurrente, crear el siguiente recordatorio
        if (reminder.is_recurring) {
            const nextDueDate = new Date(reminder.due_date);
            
            if (reminder.recurrence_type === 'monthly') {
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            } else if (reminder.recurrence_type === 'yearly') {
                nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            }

            // Crear nuevo recordatorio para el siguiente período
            await pool.execute(
                'INSERT INTO reminders (user_id, title, description, amount, due_date, reminder_days, is_recurring, recurrence_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, reminder.title, reminder.description, reminder.amount, nextDueDate, reminder.reminder_days, reminder.is_recurring, reminder.recurrence_type]
            );
        }

        // Marcar como completado
        await pool.execute(
            'UPDATE reminders SET status = "completed" WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Recordatorio marcado como completado'
        });

    } catch (error) {
        console.log('Error completando recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Actualizar recordatorio
export async function updateReminder(req, res) {
    try {
        const { id } = req.params;
        const { title, description, amount, due_date, reminder_days, is_recurring, recurrence_type } = req.body;
        const userId = req.user.userId;

        // Verificar que el recordatorio pertenece al usuario
        const [reminders] = await pool.execute(
            'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (reminders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recordatorio no encontrado'
            });
        }

        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (amount !== undefined) {
            updates.push('amount = ?');
            values.push(amount);
        }
        if (due_date !== undefined) {
            updates.push('due_date = ?');
            values.push(due_date);
        }
        if (reminder_days !== undefined) {
            updates.push('reminder_days = ?');
            values.push(reminder_days);
        }
        if (is_recurring !== undefined) {
            updates.push('is_recurring = ?');
            values.push(is_recurring);
        }
        if (recurrence_type !== undefined) {
            updates.push('recurrence_type = ?');
            values.push(recurrence_type);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }

        values.push(id);
        const query = `UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`;
        
        await pool.execute(query, values);

        res.status(200).json({
            success: true,
            message: 'Recordatorio actualizado exitosamente'
        });

    } catch (error) {
        console.log('Error actualizando recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Eliminar recordatorio
export async function deleteReminder(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verificar que el recordatorio pertenece al usuario
        const [reminders] = await pool.execute(
            'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (reminders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recordatorio no encontrado'
            });
        }

        // Eliminar recordatorio
        await pool.execute(
            'DELETE FROM reminders WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Recordatorio eliminado exitosamente'
        });

    } catch (error) {
        console.log('Error eliminando recordatorio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener recordatorios que necesitan notificación
export async function getRemindersForNotification(req, res) {
    try {
        const userId = req.user.userId;

        const [reminders] = await pool.execute(`
            SELECT * FROM reminders 
            WHERE user_id = ? 
            AND status = 'pending' 
            AND due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL reminder_days DAY)
            ORDER BY due_date ASC
        `, [userId]);

        res.status(200).json({
            success: true,
            data: { reminders }
        });

    } catch (error) {
        console.log('Error obteniendo recordatorios para notificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener resumen de recordatorios
export async function getRemindersSummary(req, res) {
    try {
        const userId = req.user.userId;

        // Estadísticas de recordatorios
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_reminders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reminders,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_reminders,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_reminders,
                SUM(CASE WHEN is_recurring = true THEN 1 ELSE 0 END) as recurring_reminders
            FROM reminders 
            WHERE user_id = ?
        `, [userId]);

        // Próximos vencimientos
        const [upcoming] = await pool.execute(`
            SELECT * FROM reminders 
            WHERE user_id = ? AND status = 'pending' 
            ORDER BY due_date ASC 
            LIMIT 5
        `, [userId]);

        res.status(200).json({
            success: true,
            data: {
                summary: stats[0],
                upcoming: upcoming.map(reminder => {
                    const dueDate = new Date(reminder.due_date);
                    const today = new Date();
                    const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    
                    return {
                        ...reminder,
                        daysRemaining
                    };
                })
            }
        });

    } catch (error) {
        console.log('Error obteniendo resumen de recordatorios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
