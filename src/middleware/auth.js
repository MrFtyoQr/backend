import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

// Middleware para verificar JWT token
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token de acceso requerido' 
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario existe en la base de datos
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        // Agregar información del usuario al request
        req.user = {
            userId: decoded.userId,
            subscriptionType: users[0].subscription_type,
            aiQuestionsUsed: users[0].ai_questions_used
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expirado' 
            });
        }
        
        return res.status(403).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

// Middleware para verificar suscripción premium
export const requirePremium = (req, res, next) => {
    if (req.user.subscriptionType !== 'premium') {
        return res.status(403).json({ 
            success: false, 
            message: 'Se requiere suscripción premium para acceder a esta función' 
        });
    }
    next();
};

// Middleware para verificar límites de IA (solo para usuarios free)
export const checkAIUsage = async (req, res, next) => {
    try {
        if (req.user.subscriptionType === 'premium') {
            return next(); // Usuarios premium no tienen límites
        }

        // Verificar si el usuario free ha excedido sus 3 preguntas mensuales
        if (req.user.aiQuestionsUsed >= 3) {
            return res.status(403).json({ 
                success: false, 
                message: 'Has alcanzado el límite de preguntas mensuales. Actualiza a premium para preguntas ilimitadas.',
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Error verificando uso de IA' 
        });
    }
};

// Función para generar tokens
export const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
        { userId }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// Función para verificar refresh token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Refresh token inválido');
    }
};
