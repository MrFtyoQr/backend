import { pool } from '../config/db.js';
import { createPaymentIntent, confirmPaymentIntent, isStripeAvailable } from '../services/stripeService.js';

// Crear Payment Intent (iniciar proceso de pago)
export async function createPayment(req, res) {
    try {
        const { amount, currency = 'usd' } = req.body;
        const userId = req.user.userId;

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Monto invalido'
            });
        }

        const sanitizedCurrency = typeof currency === 'string' ? currency.trim().toLowerCase() : 'usd';
        if (!/^[a-z]{3}$/.test(sanitizedCurrency)) {
            return res.status(400).json({
                success: false,
                message: 'Moneda invalida'
            });
        }

        if (!isStripeAvailable()) {
            return res.status(503).json({
                success: false,
                message: 'Stripe no esta configurado. No se puede iniciar el pago en este momento.'
            });
        }

        const result = await createPaymentIntent(numericAmount, sanitizedCurrency, {
            user_id: userId,
            subscription_type: 'premium'
        });

        if (!result.success) {
            const statusCode = result.error?.includes('not configured') ? 503 : 500;
            return res.status(statusCode).json({
                success: false,
                message: result.error || 'Error creando pago'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                clientSecret: result.clientSecret,
                paymentIntentId: result.paymentIntentId,
                amount: numericAmount,
                currency: sanitizedCurrency
            }
        });

    } catch (error) {
        console.log('Error creando pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// confirmar pago exitoso
export async function confirmPayment(req, res) {
    try {
        const { payment_intent_id: paymentIntentId } = req.body;
        const userId = req.user.userId;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment Intent ID requerido'
            });
        }

        if (!isStripeAvailable()) {
            return res.status(503).json({
                success: false,
                message: 'Stripe no esta configurado. No se puede confirmar el pago en este momento.'
            });
        }

        const stripeResult = await confirmPaymentIntent(paymentIntentId);

        if (!stripeResult.success) {
            const statusCode = stripeResult.error?.includes('not configured') ? 503 : 400;
            return res.status(statusCode).json({
                success: false,
                message: stripeResult.error || 'Pago no confirmado en Stripe'
            });
        }

        const paymentIntent = stripeResult.paymentIntent;
        const normalizedCurrency = typeof paymentIntent.currency === 'string'
            ? paymentIntent.currency.toLowerCase()
            : 'usd';
        const rawAmount = paymentIntent.amount_received ?? paymentIntent.amount;
        const amount = Number(rawAmount) / 100;

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Monto recibido invalido desde Stripe'
            });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const [existingPayments] = await pool.execute(
            'SELECT * FROM payments WHERE transaction_id = ?',
            [paymentIntentId]
        );

        if (existingPayments.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Pago ya procesado anteriormente'
            });
        }

        await pool.execute(
            'INSERT INTO payments (user_id, transaction_id, amount, currency, subscription_type, status, payment_method, payment_provider) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, paymentIntentId, amount, normalizedCurrency, 'premium', 'completed', (Array.isArray(paymentIntent.payment_method_types) && paymentIntent.payment_method_types.length ? paymentIntent.payment_method_types[0] : 'card'), 'stripe']
        );

        await pool.execute(
            'UPDATE users SET subscription_type = ?, ai_questions_used = 0 WHERE user_id = ?',
            ['premium', userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Pago confirmado y suscripcion actualizada exitosamente',
            data: {
                subscriptionType: 'premium',
                transactionId: paymentIntentId,
                amount,
                currency: normalizedCurrency
            }
        });

    } catch (error) {
        console.log('Error confirmando pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener historial de pagos del usuario
export async function getPaymentHistory(req, res) {
    try {
        const userId = req.user.userId;

        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: { payments }
        });

    } catch (error) {
        console.log('Error obteniendo historial de pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener información de suscripción actual
export async function getSubscriptionInfo(req, res) {
    try {
        const userId = req.user.userId;

        const [users] = await pool.execute(
            'SELECT subscription_type, ai_questions_used, created_at FROM users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        // Obtener último pago
        const [lastPayment] = await pool.execute(
            'SELECT * FROM payments WHERE user_id = ? AND status = "completed" ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        const subscriptionInfo = {
            subscriptionType: user.subscription_type,
            aiQuestionsUsed: user.ai_questions_used,
            limit: user.subscription_type === 'premium' ? 'unlimited' : 3,
            remaining: user.subscription_type === 'premium' ? 'unlimited' : Math.max(0, 3 - user.ai_questions_used),
            memberSince: user.created_at,
            lastPayment: lastPayment.length > 0 ? lastPayment[0] : null
        };

        res.status(200).json({
            success: true,
            data: { subscriptionInfo }
        });

    } catch (error) {
        console.log('Error obteniendo información de suscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Cancelar suscripción (downgrade a free)
export async function cancelSubscription(req, res) {
    try {
        const userId = req.user.userId;

        // Actualizar suscripción a free
        await pool.execute(
            'UPDATE users SET subscription_type = "free" WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'Suscripción cancelada exitosamente'
        });

    } catch (error) {
        console.log('Error cancelando suscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Webhook para Stripe (opcional - para validación adicional)
export async function stripeWebhook(req, res) {
    try {
        if (!isStripeAvailable()) {
            console.log('Stripe no esta configurado; ignorando webhook entrante.');
            return res.status(202).json({ received: true, skipped: 'stripe_unavailable' });
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.log('Stripe webhook secret no configurado; webhook omitido.');
            return res.status(202).json({ received: true, skipped: 'webhook_secret_missing' });
        }

        console.log('Stripe webhook recibido, pero la verificaci�n de firma a�n no est� implementada.');
        return res.status(501).json({
            success: false,
            message: 'Verificaci�n de webhook pendiente de implementaci�n segura'
        });
    } catch (error) {
        console.log('Error procesando webhook de Stripe:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando webhook'
        });
    }
}





