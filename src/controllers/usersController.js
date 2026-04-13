import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';

// Registro de usuario
export async function registerUser(req, res) {
    try {
        const { user_id, email, password } = req.body;

        console.log('📝 REGISTER ATTEMPT:');
        console.log('  - user_id:', user_id);
        console.log('  - email:', email);
        console.log('  - password length:', password ? password.length : 'undefined');

        // Validar campos requeridos
        if (!user_id || !email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        console.log('🔍 Checking if user already exists...');
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE user_id = ? OR email = ?',
            [user_id, email]
        );

        console.log('📊 Existing users found:', existingUsers.length);
        if (existingUsers.length > 0) {
            console.log('❌ User already exists');
            return res.status(409).json({
                success: false,
                message: 'Usuario o email ya existe'
            });
        }

        // Encriptar contraseña
        console.log('🔐 Hashing password...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('  - Hash length:', hashedPassword.length);
        console.log('  - Hash starts with:', hashedPassword.substring(0, 10) + '...');

        // Crear usuario
        console.log('💾 Creating user in database...');
        await pool.execute(
            'INSERT INTO users (user_id, email, password_hash, subscription_type, ai_questions_used) VALUES (?, ?, ?, ?, ?)',
            [user_id, email, hashedPassword, 'free', 0]
        );

        // Generar tokens
        console.log('🎫 Generating tokens...');
        const { accessToken, refreshToken } = generateTokens(user_id);
        console.log('  - Access token length:', accessToken ? accessToken.length : 'undefined');
        console.log('  - Refresh token length:', refreshToken ? refreshToken.length : 'undefined');

        console.log('✅ REGISTER SUCCESSFUL');
        console.log('  - User created:', user_id);
        console.log('  - Email:', email);
        console.log('  - Subscription: free');

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    userId: user_id,
                    email: email,
                    subscriptionType: 'free',
                    aiQuestionsUsed: 0
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.log('Error registrando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Login de usuario
export async function loginUser(req, res) {
    try {
        const { user_id, password } = req.body;

        console.log('🔐 LOGIN ATTEMPT:');
        console.log('  - user_id:', user_id);
        console.log('  - password length:', password ? password.length : 'undefined');
        console.log('  - user_id type:', typeof user_id);
        console.log('  - user_id length:', user_id ? user_id.length : 'undefined');

        if (!user_id || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario
        console.log('🔍 Searching user in database...');
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [user_id]
        );

        console.log('📊 Database query result:');
        console.log('  - Users found:', users.length);
        if (users.length > 0) {
            console.log('  - Found user_id:', users[0].user_id);
            console.log('  - Found email:', users[0].email);
            console.log('  - Subscription:', users[0].subscription_type);
        }

        if (users.length === 0) {
            console.log('❌ User not found in database');
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar contraseña
        console.log('🔑 Verifying password...');
        console.log('  - Stored hash length:', user.password_hash ? user.password_hash.length : 'undefined');
        console.log('  - Stored hash starts with:', user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'undefined');
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('  - Password valid:', isValidPassword);

        if (!isValidPassword) {
            console.log('❌ Password verification failed');
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar tokens
        console.log('🎫 Generating tokens...');
        const { accessToken, refreshToken } = generateTokens(user_id);
        console.log('  - Access token length:', accessToken ? accessToken.length : 'undefined');
        console.log('  - Refresh token length:', refreshToken ? refreshToken.length : 'undefined');

        console.log('✅ LOGIN SUCCESSFUL');
        console.log('  - User authenticated:', user_id);
        console.log('  - Email:', user.email);
        console.log('  - Subscription:', user.subscription_type);

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    userId: user.user_id,
                    email: user.email,
                    subscriptionType: user.subscription_type,
                    aiQuestionsUsed: user.ai_questions_used
                },
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.log('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Refresh token
export async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token requerido'
            });
        }

        // Verificar refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Verificar que el usuario existe
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

        // Generar nuevos tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        res.status(200).json({
            success: true,
            message: 'Token renovado exitosamente',
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });

    } catch (error) {
        console.log('Error renovando token:', error);
        res.status(401).json({
            success: false,
            message: 'Refresh token inválido'
        });
    }
}

// Solicitar recuperación de contraseña (envía token por email o lo devuelve en dev)
export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El correo es requerido'
            });
        }

        const [users] = await pool.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        // Por seguridad, siempre devolvemos el mismo mensaje (no revelar si el email existe)
        const successMessage = 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.';

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: successMessage
            });
        }

        const userId = users[0].user_id;
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await pool.execute(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );

        // TODO: enviar email con enlace (ej: https://tuapp.com/reset-password?token=xxx)
        // Por ahora en desarrollo puedes loguear el token para pruebas
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔑 Password reset token for', email, ':', token);
        }

        res.status(200).json({
            success: true,
            message: successMessage,
            ...(process.env.NODE_ENV !== 'production' && { data: { token } })
        });
    } catch (error) {
        console.log('Error en forgot password:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Restablecer contraseña con token
export async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const [rows] = await pool.execute(
            'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
            [token.trim()]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El enlace ha expirado o no es válido. Solicita uno nuevo.'
            });
        }

        const userId = rows[0].user_id;
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.execute(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
            [hashedPassword, userId]
        );
        await pool.execute('DELETE FROM password_reset_tokens WHERE token = ?', [token.trim()]);

        res.status(200).json({
            success: true,
            message: 'Contraseña actualizada. Ya puedes iniciar sesión.'
        });
    } catch (error) {
        console.log('Error en reset password:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Logout (opcional - principalmente para invalidar tokens en el cliente)
export async function logoutUser(req, res) {
    try {
        res.status(200).json({
            success: true,
            message: 'Logout exitoso'
        });
    } catch (error) {
        console.log('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener perfil del usuario
export async function getUserProfile(req, res) {
    try {
        const userId = req.user.userId;

        const [users] = await pool.execute(
            'SELECT user_id, email, subscription_type, ai_questions_used, created_at FROM users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        res.status(200).json({
            success: true,
            data: {
                user: {
                    userId: user.user_id,
                    email: user.email,
                    subscriptionType: user.subscription_type,
                    aiQuestionsUsed: user.ai_questions_used,
                    createdAt: user.created_at
                }
            }
        });

    } catch (error) {
        console.log('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Actualizar suscripción a premium
export async function upgradeSubscription(req, res) {
    try {
        const userId = req.user.userId;

        // Actualizar suscripción a premium
        await pool.execute(
            'UPDATE users SET subscription_type = ? WHERE user_id = ?',
            ['premium', userId]
        );

        res.status(200).json({
            success: true,
            message: 'Suscripción actualizada a premium exitosamente',
            data: {
                subscriptionType: 'premium'
            }
        });

    } catch (error) {
        console.log('Error actualizando suscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener uso de IA del usuario
export async function getAIUsage(req, res) {
    try {
        const userId = req.user.userId;
        const subscriptionType = req.user.subscriptionType;
        
        const today = new Date().toISOString().split('T')[0];
        const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Obtener uso actual de análisis de mercado
        const [dailyAnalysis] = await pool.execute(
            'SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ? AND DATE(created_at) = ? AND type = "market_analysis"',
            [userId, today]
        );
        
        const [weeklyAnalysis] = await pool.execute(
            'SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ? AND DATE(created_at) >= ? AND type = "market_analysis"',
            [userId, weekStart]
        );

        const [dailyChat] = await pool.execute(
            'SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ? AND DATE(created_at) = ? AND type = "chat"',
            [userId, today]
        );

        const dailyAnalysisCount = dailyAnalysis[0].count;
        const weeklyAnalysisCount = weeklyAnalysis[0].count;
        const dailyChatCount = dailyChat[0].count;

        let limits = {};
        let remaining = {};

        switch (subscriptionType.toLowerCase()) {
            case 'free':
                limits = { dailyAnalysis: 1, dailyChat: 3 };
                remaining = { 
                    dailyAnalysis: Math.max(0, 1 - dailyAnalysisCount),
                    dailyChat: Math.max(0, 3 - dailyChatCount)
                };
                break;
            case 'premium':
                limits = { weeklyAnalysis: 3, dailyChat: 10 };
                remaining = { 
                    weeklyAnalysis: Math.max(0, 3 - weeklyAnalysisCount),
                    dailyChat: Math.max(0, 10 - dailyChatCount)
                };
                break;
            case 'premium+':
                limits = { unlimited: true };
                remaining = { unlimited: true };
                break;
        }

        // Campos used/limit para la pantalla de chat (compatibilidad con la app móvil)
        const chatLimit = subscriptionType === 'free' ? 3 : (subscriptionType === 'premium' ? 10 : 999999);
        const chatUsed = subscriptionType === 'free'
            ? (Number(req.user.aiQuestionsUsed) || 0)
            : dailyChatCount;

        const usage = {
            subscriptionType,
            dailyAnalysisCount,
            weeklyAnalysisCount,
            dailyChatCount,
            limits,
            remaining,
            used: chatUsed,
            limit: chatLimit
        };

        res.status(200).json({
            success: true,
            data: { usage }
        });

    } catch (error) {
        console.log('Error obteniendo uso de IA:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
