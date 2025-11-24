import axios from 'axios';
import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Función para obtener contexto financiero del usuario
async function getUserFinancialContext(userId) {
    try {
        // Obtener resumen financiero
        const [balanceResult] = await pool.execute(
            'SELECT COALESCE(SUM(amount),0) as balance FROM transactions WHERE user_id = ?',
            [userId]
        );

        const [incomeResult] = await pool.execute(
            'SELECT COALESCE(SUM(amount),0) as income FROM transactions WHERE user_id = ? AND type = "income"',
            [userId]
        );

        const [expensesResult] = await pool.execute(
            'SELECT COALESCE(SUM(amount),0) as expenses FROM transactions WHERE user_id = ? AND type = "expense"',
            [userId]
        );

        // Obtener transacciones recientes
        const [recentTransactions] = await pool.execute(
            'SELECT title, amount, category, type, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [userId]
        );

        // Obtener metas activas
        const [activeGoals] = await pool.execute(
            'SELECT title, target_amount, current_amount, deadline FROM goals WHERE user_id = ? AND status = "active"',
            [userId]
        );

        // Obtener recordatorios pendientes
        const [pendingReminders] = await pool.execute(
            'SELECT title, amount, due_date FROM reminders WHERE user_id = ? AND status = "pending" ORDER BY due_date ASC LIMIT 5',
            [userId]
        );

        return {
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expenses: expensesResult[0].expenses,
            recentTransactions,
            activeGoals,
            pendingReminders
        };
    } catch (error) {
        console.log('Error obteniendo contexto financiero:', error);
        return null;
    }
}

// Función para enviar mensaje a OpenRouter
async function sendToOpenRouter(message, context) {
    try {
        const systemPrompt = `Eres un asistente financiero personal experto. Tienes acceso al contexto financiero del usuario:

CONTEXTO FINANCIERO:
- Balance actual: $${context.balance}
- Ingresos totales: $${context.income}
- Gastos totales: $${context.expenses}
- Transacciones recientes: ${JSON.stringify(context.recentTransactions)}
- Metas activas: ${JSON.stringify(context.activeGoals)}
- Recordatorios pendientes: ${JSON.stringify(context.pendingReminders)}

INSTRUCCIONES:
1. Proporciona consejos financieros personalizados basados en el contexto
2. Analiza patrones de gasto y sugiere mejoras
3. Ayuda con estrategias de ahorro para las metas
4. Recuerda fechas importantes y gastos pendientes
5. Sé específico y práctico en tus recomendaciones
6. Mantén un tono amigable pero profesional

Responde en español y sé conciso pero útil.`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            max_tokens: 1000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.log('Error con OpenRouter:', error);
        throw new Error('Error procesando consulta con IA');
    }
}

// Chat con IA
export async function chatWithAI(req, res) {
    try {
        const { message, conversationId } = req.body;
        const userId = req.user.userId;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Mensaje requerido'
            });
        }

        // Obtener contexto financiero del usuario
        const context = await getUserFinancialContext(userId);
        if (!context) {
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo contexto financiero'
            });
        }

        // Enviar mensaje a OpenRouter
        const aiResponse = await sendToOpenRouter(message, context);

        // Generar ID de conversación si no existe
        const finalConversationId = conversationId || uuidv4();

        // Guardar conversación en la base de datos
        await pool.execute(
            'INSERT INTO ai_conversations (user_id, message, response, conversation_id) VALUES (?, ?, ?, ?)',
            [userId, message, aiResponse, finalConversationId]
        );

        // Incrementar contador de preguntas para usuarios free
        if (req.user.subscriptionType === 'free') {
            await pool.execute(
                'UPDATE users SET ai_questions_used = ai_questions_used + 1 WHERE user_id = ?',
                [userId]
            );
        }

        res.status(200).json({
            success: true,
            data: {
                response: aiResponse,
                conversationId: finalConversationId,
                context: {
                    balance: context.balance,
                    recentTransactions: context.recentTransactions.slice(0, 3),
                    activeGoals: context.activeGoals.slice(0, 2)
                }
            }
        });

    } catch (error) {
        console.log('Error en chat con IA:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando consulta con IA'
        });
    }
}

// Obtener historial de conversaciones
export async function getConversations(req, res) {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.query;

        let query = 'SELECT * FROM ai_conversations WHERE user_id = ?';
        let params = [userId];

        if (conversationId) {
            query += ' AND conversation_id = ?';
            params.push(conversationId);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const [conversations] = await pool.execute(query, params);

        res.status(200).json({
            success: true,
            data: { conversations }
        });

    } catch (error) {
        console.log('Error obteniendo conversaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener conversaciones por ID
export async function getConversationById(req, res) {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId;

        const [conversations] = await pool.execute(
            'SELECT * FROM ai_conversations WHERE user_id = ? AND conversation_id = ? ORDER BY created_at ASC',
            [userId, conversationId]
        );

        res.status(200).json({
            success: true,
            data: { conversations }
        });

    } catch (error) {
        console.log('Error obteniendo conversación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Análisis financiero personalizado
export async function getFinancialAnalysis(req, res) {
    try {
        const userId = req.user.userId;

        // Obtener contexto financiero
        const context = await getUserFinancialContext(userId);
        if (!context) {
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo contexto financiero'
            });
        }

        // Crear prompt para análisis
        const analysisPrompt = `Analiza la situación financiera del usuario y proporciona un análisis detallado:

DATOS FINANCIEROS:
- Balance: $${context.balance}
- Ingresos: $${context.income}
- Gastos: $${context.expenses}
- Transacciones recientes: ${JSON.stringify(context.recentTransactions)}
- Metas: ${JSON.stringify(context.activeGoals)}

Proporciona:
1. Análisis de la salud financiera actual
2. Patrones de gasto identificados
3. Recomendaciones específicas de mejora
4. Estrategias para alcanzar las metas
5. Alertas o preocupaciones importantes

Sé específico y práctico.`;

        const analysis = await sendToOpenRouter(analysisPrompt, context);

        res.status(200).json({
            success: true,
            data: {
                analysis,
                context: {
                    balance: context.balance,
                    income: context.income,
                    expenses: context.expenses,
                    activeGoals: context.activeGoals,
                    pendingReminders: context.pendingReminders
                }
            }
        });

    } catch (error) {
        console.log('Error en análisis financiero:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando análisis financiero'
        });
    }
}
