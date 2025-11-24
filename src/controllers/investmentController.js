import { pool } from '../config/db.js';

// Análisis de inversión personalizado
export async function getInvestmentAnalysis(req, res) {
    try {
        const userId = req.user.userId;
        const { symbol } = req.query;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Símbolo de inversión requerido'
            });
        }

        // Obtener datos de mercado del símbolo
        const [marketData] = await pool.execute(
            'SELECT * FROM market_data WHERE symbol = ? ORDER BY last_updated DESC LIMIT 1',
            [symbol]
        );

        if (marketData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Datos de mercado no encontrados para este símbolo'
            });
        }

        const data = marketData[0];

        // Obtener historial de análisis del usuario para este símbolo
        const [userAnalysis] = await pool.execute(
            'SELECT * FROM investment_analysis WHERE user_id = ? AND symbol = ? ORDER BY created_at DESC LIMIT 5',
            [userId, symbol]
        );

        // Análisis básico
        const analysis = {
            symbol: data.symbol,
            currentPrice: data.price,
            change24h: data.change_24h,
            volume24h: data.volume_24h,
            marketCap: data.market_cap,
            lastUpdated: data.last_updated,
            technicalAnalysis: {
                trend: data.change_24h > 0 ? 'bullish' : data.change_24h < 0 ? 'bearish' : 'neutral',
                volatility: data.change_24h > 5 ? 'high' : data.change_24h > 2 ? 'medium' : 'low',
                volume: data.volume_24h > 1000000 ? 'high' : data.volume_24h > 100000 ? 'medium' : 'low'
            },
            userHistory: userAnalysis
        };

        res.status(200).json({
            success: true,
            data: { analysis }
        });

    } catch (error) {
        console.log('Error obteniendo análisis de inversión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener recomendación personalizada
export async function getPersonalizedRecommendation(req, res) {
    try {
        const userId = req.user.userId;
        const { symbol, amount, timeframe } = req.body;

        if (!symbol || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Símbolo y monto son requeridos'
            });
        }

        // Obtener datos de mercado
        const [marketData] = await pool.execute(
            'SELECT * FROM market_data WHERE symbol = ? ORDER BY last_updated DESC LIMIT 1',
            [symbol]
        );

        if (marketData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Datos de mercado no encontrados'
            });
        }

        // Obtener perfil financiero del usuario
        const [userProfile] = await pool.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE user_id = ?
        `, [userId]);

        const profile = userProfile[0];
        const data = marketData[0];

        // Análisis de riesgo básico
        const riskLevel = amount > (profile.total_income * 0.1) ? 'high' : 
                         amount > (profile.total_income * 0.05) ? 'medium' : 'low';

        // Generar recomendación
        const recommendation = {
            symbol: data.symbol,
            currentPrice: data.price,
            recommendedAmount: amount,
            riskLevel,
            timeframe: timeframe || 'long-term',
            analysis: {
                priceChange: data.change_24h,
                volume: data.volume_24h,
                marketCap: data.market_cap,
                recommendation: data.change_24h > 5 ? 'caution' : 
                               data.change_24h < -5 ? 'opportunity' : 'neutral'
            },
            advice: generateInvestmentAdvice(data, amount, riskLevel, profile)
        };

        // Guardar análisis en la base de datos
        await pool.execute(
            'INSERT INTO investment_analysis (user_id, symbol, analysis_type, confidence_score, reasoning, ai_recommendation) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, symbol, recommendation.analysis.recommendation, 0.7, JSON.stringify(recommendation.analysis), recommendation.advice]
        );

        res.status(200).json({
            success: true,
            data: { recommendation }
        });

    } catch (error) {
        console.log('Error obteniendo recomendación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Función para generar consejos de inversión
function generateInvestmentAdvice(marketData, amount, riskLevel, userProfile) {
    const advice = [];
    
    // Consejos basados en el cambio de precio
    if (marketData.change_24h > 5) {
        advice.push("⚠️ Precio en alza significativa - considera esperar una corrección");
    } else if (marketData.change_24h < -5) {
        advice.push("📈 Precio en baja - podría ser una oportunidad de compra");
    }

    // Consejos basados en el volumen
    if (marketData.volume_24h > 1000000) {
        advice.push("📊 Alto volumen de transacciones - mayor liquidez");
    }

    // Consejos basados en el nivel de riesgo
    if (riskLevel === 'high') {
        advice.push("🚨 Inversión de alto riesgo - no inviertas más del 10% de tus ingresos");
    } else if (riskLevel === 'medium') {
        advice.push("⚖️ Inversión de riesgo medio - considera diversificar");
    } else {
        advice.push("✅ Inversión de bajo riesgo - buena para principiantes");
    }

    // Consejos basados en el perfil del usuario
    if (userProfile.total_expenses > userProfile.total_income * 0.8) {
        advice.push("💰 Considera mejorar tu situación financiera antes de invertir");
    }

    return advice.join(' ');
}

// Obtener portfolio del usuario
export async function getUserPortfolio(req, res) {
    try {
        const userId = req.user.userId;

        // Obtener análisis de inversiones del usuario
        const [investments] = await pool.execute(
            'SELECT * FROM investment_analysis WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Agrupar por símbolo
        const portfolio = {};
        investments.forEach(investment => {
            if (!portfolio[investment.symbol]) {
                portfolio[investment.symbol] = {
                    symbol: investment.symbol,
                    analyses: [],
                    latestRecommendation: null,
                    totalAnalyses: 0
                };
            }
            portfolio[investment.symbol].analyses.push(investment);
            portfolio[investment.symbol].totalAnalyses++;
            
            if (!portfolio[investment.symbol].latestRecommendation || 
                new Date(investment.created_at) > new Date(portfolio[investment.symbol].latestRecommendation.created_at)) {
                portfolio[investment.symbol].latestRecommendation = investment;
            }
        });

        // Obtener datos actuales de mercado para cada símbolo
        const symbols = Object.keys(portfolio);
        const marketData = {};
        
        for (const symbol of symbols) {
            const [data] = await pool.execute(
                'SELECT * FROM market_data WHERE symbol = ? ORDER BY last_updated DESC LIMIT 1',
                [symbol]
            );
            if (data.length > 0) {
                marketData[symbol] = data[0];
            }
        }

        // Combinar datos
        const portfolioWithMarketData = Object.values(portfolio).map(item => ({
            ...item,
            currentMarketData: marketData[item.symbol] || null
        }));

        res.status(200).json({
            success: true,
            data: { portfolio: portfolioWithMarketData }
        });

    } catch (error) {
        console.log('Error obteniendo portfolio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Configurar alerta de inversión
export async function setInvestmentAlert(req, res) {
    try {
        const { symbol, target_price, alert_type = 'price' } = req.body;
        const userId = req.user.userId;

        if (!symbol || !target_price) {
            return res.status(400).json({
                success: false,
                message: 'Símbolo y precio objetivo son requeridos'
            });
        }

        // Obtener precio actual
        const [marketData] = await pool.execute(
            'SELECT price FROM market_data WHERE symbol = ? ORDER BY last_updated DESC LIMIT 1',
            [symbol]
        );

        if (marketData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Símbolo no encontrado en datos de mercado'
            });
        }

        const currentPrice = marketData[0].price;
        const isAbove = target_price > currentPrice;

        // Crear recordatorio para la alerta
        const alertTitle = `Alerta de ${symbol}: ${isAbove ? 'Subida' : 'Bajada'} a $${target_price}`;
        const alertDescription = `Precio actual: $${currentPrice}. ${isAbove ? 'Esperando subida' : 'Esperando bajada'} a $${target_price}`;

        await pool.execute(
            'INSERT INTO reminders (user_id, title, description, due_date, reminder_days, is_recurring) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, alertTitle, alertDescription, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 1, false]
        );

        res.status(201).json({
            success: true,
            message: 'Alerta de inversión configurada exitosamente',
            data: {
                symbol,
                currentPrice,
                targetPrice: target_price,
                alertType: alert_type,
                isAbove
            }
        });

    } catch (error) {
        console.log('Error configurando alerta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Obtener tendencias de mercado
export async function getMarketTrends(req, res) {
    try {
        const { timeframe = '24h' } = req.query;

        let timeFilter = '';
        switch (timeframe) {
            case '1h':
                timeFilter = 'AND last_updated >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
                break;
            case '24h':
                timeFilter = 'AND last_updated >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
                break;
            case '7d':
                timeFilter = 'AND last_updated >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            default:
                timeFilter = 'AND last_updated >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
        }

        // Obtener tendencias de criptomonedas
        const [cryptoTrends] = await pool.execute(`
            SELECT symbol, price, change_24h, volume_24h, market_cap, last_updated
            FROM market_data 
            WHERE symbol IN ('BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'AVAX', 'MATIC')
            ${timeFilter}
            ORDER BY change_24h DESC
        `);

        // Obtener tendencias de acciones
        const [stockTrends] = await pool.execute(`
            SELECT symbol, price, change_24h, volume_24h, market_cap, last_updated
            FROM market_data 
            WHERE symbol IN ('AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC')
            ${timeFilter}
            ORDER BY change_24h DESC
        `);

        // Calcular métricas de tendencia
        const cryptoGainers = cryptoTrends.filter(coin => coin.change_24h > 0);
        const cryptoLosers = cryptoTrends.filter(coin => coin.change_24h < 0);
        const stockGainers = stockTrends.filter(stock => stock.change_24h > 0);
        const stockLosers = stockTrends.filter(stock => stock.change_24h < 0);

        const trends = {
            crypto: {
                total: cryptoTrends.length,
                gainers: cryptoGainers.length,
                losers: cryptoLosers.length,
                topGainer: cryptoGainers[0] || null,
                topLoser: cryptoLosers[cryptoLosers.length - 1] || null,
                averageChange: cryptoTrends.length > 0 ? 
                    cryptoTrends.reduce((sum, coin) => sum + coin.change_24h, 0) / cryptoTrends.length : 0
            },
            stocks: {
                total: stockTrends.length,
                gainers: stockGainers.length,
                losers: stockLosers.length,
                topGainer: stockGainers[0] || null,
                topLoser: stockLosers[stockLosers.length - 1] || null,
                averageChange: stockTrends.length > 0 ? 
                    stockTrends.reduce((sum, stock) => sum + stock.change_24h, 0) / stockTrends.length : 0
            },
            timeframe
        };

        res.status(200).json({
            success: true,
            data: { trends }
        });

    } catch (error) {
        console.log('Error obteniendo tendencias:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
