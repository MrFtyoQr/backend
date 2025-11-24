import mysql from 'mysql2/promise';
import 'dotenv/config';

const getConfigFromDatabaseUrl = () => {
  const url = new URL(process.env.DATABASE_URL);

  if (!url.username || !url.password) {
    throw new Error('DATABASE_URL must include username and password');
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0,
  };
};

const getConfigFromDiscreteEnv = () => {
  const requiredKeys = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = requiredKeys.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing database configuration for: ${missing.join(', ')}`);
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0,
  };
};

function buildDbConfig() {
  if (process.env.DATABASE_URL) {
    return getConfigFromDatabaseUrl();
  }

  return getConfigFromDiscreteEnv();
}

const dbConfig = buildDbConfig();

export const pool = mysql.createPool(dbConfig);

export async function initDB() {
  try {
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(255) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                subscription_type ENUM('free', 'premium', 'premium+') DEFAULT 'free',
                ai_questions_used INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

    await pool.execute(`
            CREATE TABLE IF NOT EXISTS ai_conversations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                response TEXT NOT NULL,
                conversation_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_conversation (user_id, conversation_id)
            )
        `);

    await pool.execute(`
            CREATE TABLE IF NOT EXISTS market_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                symbol VARCHAR(50) NOT NULL,
                price DECIMAL(20, 8) NOT NULL,
                change_24h DECIMAL(10, 4),
                volume_24h DECIMAL(20, 2),
                market_cap DECIMAL(20, 2),
                type ENUM('crypto', 'stocks', 'forex') NOT NULL DEFAULT 'crypto',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_symbol_type (symbol, type),
                INDEX idx_last_updated (last_updated)
            )
        `);

    // Agregar columna type si no existe (para tablas existentes)
    try {
        await pool.execute('ALTER TABLE market_data ADD COLUMN type ENUM("crypto", "stocks", "forex") NOT NULL DEFAULT "crypto"');
        console.log('✅ Columna type agregada a market_data');
    } catch (error) {
        // La columna ya existe, no hacer nada
        if (error.code !== 'ER_DUP_FIELDNAME') {
            console.log('Info: Columna type ya existe o error:', error.message);
        }
    }

    await pool.execute(`
            CREATE TABLE IF NOT EXISTS goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                target_amount DECIMAL(10, 2) NOT NULL,
                current_amount DECIMAL(10, 2) DEFAULT 0,
                deadline DATE,
                status ENUM('active', 'completed', 'paused') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_status (user_id, status)
            )
        `);

    await pool.execute(`
            CREATE TABLE IF NOT EXISTS reminders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                amount DECIMAL(10, 2),
                due_date DATE NOT NULL,
                reminder_days INT DEFAULT 3,
                is_recurring BOOLEAN DEFAULT FALSE,
                recurrence_type ENUM('monthly', 'yearly') NULL,
                status ENUM('pending', 'completed', 'overdue') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_due (user_id, due_date),
                INDEX idx_status (status)
            )
        `);

    await pool.execute(`
            CREATE TABLE IF NOT EXISTS investment_analysis (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                symbol VARCHAR(50) NOT NULL,
                analysis_type ENUM('buy', 'sell', 'hold') NOT NULL,
                confidence_score DECIMAL(3, 2),
                reasoning TEXT,
                ai_recommendation TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_symbol (user_id, symbol)
            )
        `);

    await pool.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                subscription_type ENUM('premium', 'premium+') NOT NULL,
                status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_provider VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_status (status)
            )
        `);

    // Tabla para tracking de uso de IA
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS ai_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                type ENUM('market_analysis', 'chat', 'investment_advice') NOT NULL,
                subscription_type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_date (user_id, created_at),
                INDEX idx_type_date (type, created_at)
            )
        `);

    // Tabla para análisis personalizados (Premium+)
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS personalized_analysis (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                balance DECIMAL(15,2) NOT NULL,
                risk_tolerance ENUM('low', 'medium', 'high') NOT NULL,
                investment_goals TEXT,
                analysis_data JSON,
                recommendations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_created (user_id, created_at)
            )
        `);

    // Tabla para configuración de scraping
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS scraping_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                last_crypto_update TIMESTAMP,
                last_stocks_update TIMESTAMP,
                last_forex_update TIMESTAMP,
                scraping_enabled BOOLEAN DEFAULT TRUE,
                update_interval_minutes INT DEFAULT 60
            )
        `);

    // Tabla para logs de scraping
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS scraping_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('crypto', 'stocks', 'forex', 'full') NOT NULL,
                status ENUM('success', 'error', 'partial') NOT NULL,
                records_updated INT DEFAULT 0,
                error_message TEXT,
                execution_time_ms INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_type_created (type, created_at)
            )
        `);

    // Insertar configuración inicial de scraping
    await pool.execute(`
            INSERT IGNORE INTO scraping_config (id, scraping_enabled, update_interval_minutes) 
            VALUES (1, TRUE, 60)
        `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.log('Error initializing DB', error);
    process.exit(1);
  }
}
