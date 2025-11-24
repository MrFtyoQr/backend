import { pool } from '../config/db.js';

// Crear nueva meta
export async function createGoal(req, res) {
    try {
        const { title, description, target_amount, deadline } = req.body;
        const userId = req.user.userId;

        if (!title || !target_amount) {
            return res.status(400).json({
                success: false,
                message: 'Título y monto objetivo son requeridos'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO goals (user_id, title, description, target_amount, deadline) VALUES (?, ?, ?, ?, ?)',
            [userId, title, description, target_amount, deadline]
        );

        // Obtener la meta creada
        const [goal] = await pool.execute(
            'SELECT * FROM goals WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Meta creada exitosamente',
            data: { goal: goal[0] }
        });

    } catch (error) {
        console.log('Error creando meta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener metas del usuario
export async function getUserGoals(req, res) {
    try {
        const userId = req.user.userId;
        const { status } = req.query;

        let query = 'SELECT * FROM goals WHERE user_id = ?';
        let params = [userId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [goals] = await pool.execute(query, params);

        // Calcular progreso para cada meta
        const goalsWithProgress = goals.map(goal => {
            const progress = goal.target_amount > 0 ? 
                (goal.current_amount / goal.target_amount) * 100 : 0;
            
            const daysRemaining = goal.deadline ? 
                Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

            return {
                ...goal,
                progress: Math.min(100, Math.max(0, progress)),
                daysRemaining,
                isOverdue: daysRemaining !== null && daysRemaining < 0
            };
        });

        res.status(200).json({
            success: true,
            data: { goals: goalsWithProgress }
        });

    } catch (error) {
        console.log('Error obteniendo metas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Actualizar progreso de una meta
export async function updateGoalProgress(req, res) {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const userId = req.user.userId;

        if (!amount || amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Monto válido requerido'
            });
        }

        // Verificar que la meta pertenece al usuario
        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (goals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meta no encontrada'
            });
        }

        const goal = goals[0];
        const newAmount = goal.current_amount + amount;

        // Actualizar progreso
        await pool.execute(
            'UPDATE goals SET current_amount = ? WHERE id = ?',
            [newAmount, id]
        );

        // Verificar si la meta se completó
        if (newAmount >= goal.target_amount) {
            await pool.execute(
                'UPDATE goals SET status = "completed" WHERE id = ?',
                [id]
            );
        }

        // Obtener meta actualizada
        const [updatedGoal] = await pool.execute(
            'SELECT * FROM goals WHERE id = ?',
            [id]
        );

        const progress = (updatedGoal[0].current_amount / updatedGoal[0].target_amount) * 100;

        res.status(200).json({
            success: true,
            message: newAmount >= goal.target_amount ? '¡Meta completada!' : 'Progreso actualizado',
            data: { 
                goal: updatedGoal[0],
                progress: Math.min(100, Math.max(0, progress)),
                isCompleted: newAmount >= goal.target_amount
            }
        });

    } catch (error) {
        console.log('Error actualizando progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener plan de ahorro sugerido para una meta
export async function getSavingsPlan(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Obtener la meta
        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (goals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meta no encontrada'
            });
        }

        const goal = goals[0];
        const remaining = goal.target_amount - goal.current_amount;
        const daysRemaining = goal.deadline ? 
            Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

        // Calcular plan de ahorro
        let savingsPlan = {
            remainingAmount: remaining,
            currentProgress: (goal.current_amount / goal.target_amount) * 100,
            daysRemaining,
            isCompleted: goal.current_amount >= goal.target_amount
        };

        if (!savingsPlan.isCompleted && daysRemaining && daysRemaining > 0) {
            const dailyAmount = remaining / daysRemaining;
            const weeklyAmount = dailyAmount * 7;
            const monthlyAmount = dailyAmount * 30;

            savingsPlan.suggestions = {
                daily: Math.ceil(dailyAmount * 100) / 100,
                weekly: Math.ceil(weeklyAmount * 100) / 100,
                monthly: Math.ceil(monthlyAmount * 100) / 100
            };

            // Obtener ingresos promedio del usuario para comparar
            const [incomeData] = await pool.execute(
                'SELECT COALESCE(AVG(amount), 0) as avg_income FROM transactions WHERE user_id = ? AND type = "income" AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)',
                [userId]
            );

            const avgIncome = incomeData[0].avg_income;
            if (avgIncome > 0) {
                savingsPlan.percentageOfIncome = {
                    daily: (dailyAmount / avgIncome) * 100,
                    weekly: (weeklyAmount / avgIncome) * 100,
                    monthly: (monthlyAmount / avgIncome) * 100
                };
            }
        }

        res.status(200).json({
            success: true,
            data: { savingsPlan }
        });

    } catch (error) {
        console.log('Error obteniendo plan de ahorro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Actualizar estado de una meta
export async function updateGoalStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        if (!['active', 'completed', 'paused'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        // Verificar que la meta pertenece al usuario
        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (goals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meta no encontrada'
            });
        }

        // Actualizar estado
        await pool.execute(
            'UPDATE goals SET status = ? WHERE id = ?',
            [status, id]
        );

        res.status(200).json({
            success: true,
            message: 'Estado de meta actualizado exitosamente'
        });

    } catch (error) {
        console.log('Error actualizando estado de meta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Eliminar meta
export async function deleteGoal(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verificar que la meta pertenece al usuario
        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (goals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meta no encontrada'
            });
        }

        // Eliminar meta
        await pool.execute(
            'DELETE FROM goals WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Meta eliminada exitosamente'
        });

    } catch (error) {
        console.log('Error eliminando meta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener resumen de metas
export async function getGoalsSummary(req, res) {
    try {
        const userId = req.user.userId;

        // Obtener estadísticas de metas
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_goals,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_goals,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals,
                SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_goals,
                SUM(target_amount) as total_target,
                SUM(current_amount) as total_current,
                AVG(CASE WHEN status = 'active' THEN (current_amount / target_amount) * 100 ELSE NULL END) as avg_progress
            FROM goals 
            WHERE user_id = ?
        `, [userId]);

        const [recentGoals] = await pool.execute(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: { 
                summary: stats[0],
                recentGoals: recentGoals.map(goal => ({
                    ...goal,
                    progress: (goal.current_amount / goal.target_amount) * 100
                }))
            }
        });

    } catch (error) {
        console.log('Error obteniendo resumen de metas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
