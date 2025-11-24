import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from '../config/db.js';
import OpenRouterService from '../services/openRouterService.js';

const openRouterService = new OpenRouterService();

// Función para obtener datos de criptomonedas desde CoinGecko
async function fetchCryptoDataFromAPI() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 50,
                page: 1,
                sparkline: false
            }
        });

        return response.data.map(coin => ({
            symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
            name: coin.name || 'Unknown Coin',
            price: coin.current_price || 0,
            change_24h: coin.price_change_percentage_24h || 0,
            volume_24h: coin.total_volume || 0,
            market_cap: coin.market_cap || 0,
            last_updated: new Date()
        }));
    } catch (error) {
        console.log('Error obteniendo datos de crypto:', error);
        return [];
    }
}

// Función para obtener datos de acciones desde Yahoo Finance (scraping)
async function fetchStocksDataFromAPI() {
    try {
        const stocks = [
            { symbol: 'AAPL', name: 'Apple Inc.' },
            { symbol: 'MSFT', name: 'Microsoft Corporation' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.' },
            { symbol: 'TSLA', name: 'Tesla Inc.' },
            { symbol: 'META', name: 'Meta Platforms Inc.' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation' },
            { symbol: 'NFLX', name: 'Netflix Inc.' },
            { symbol: 'AMD', name: 'Advanced Micro Devices' },
            { symbol: 'INTC', name: 'Intel Corporation' }
        ];

        const stocksData = [];

        for (const stock of stocks) {
            try {
                // Usar API de Yahoo Finance (más confiable que scraping)
                const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}`);
                const data = response.data.chart.result[0];
                const meta = data.meta;
                const quote = data.indicators.quote[0];

                stocksData.push({
                    symbol: stock.symbol,
                    name: stock.name,
                    price: meta.regularMarketPrice || 0,
                    change_24h: (meta.regularMarketChangePercent || 0) * 100,
                    volume_24h: meta.regularMarketVolume || 0,
                    market_cap: meta.marketCap || 0,
                    last_updated: new Date()
                });

                // Pequeña pausa para no sobrecargar la API
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.log(`Error obteniendo datos de ${stock.symbol}:`, error.message);
            }
        }

        return stocksData;
    } catch (error) {
        console.log('Error obteniendo datos de acciones:', error);
        return [];
    }
}

// Función para guardar datos de mercado en la base de datos
async function saveMarketData(marketData, type = 'crypto') {
    try {
        for (const data of marketData) {
            // Validar y limpiar datos antes de insertar
            const cleanData = {
                symbol: data.symbol || 'UNKNOWN',
                price: data.price || 0,
                change_24h: data.change_24h || 0,
                volume_24h: data.volume_24h || 0,
                market_cap: data.market_cap || 0,
                last_updated: data.last_updated || new Date()
            };

            await pool.execute(
                `INSERT INTO market_data (symbol, price, change_24h, volume_24h, market_cap, type, last_updated) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 price = VALUES(price), 
                 change_24h = VALUES(change_24h), 
                 volume_24h = VALUES(volume_24h), 
                 market_cap = VALUES(market_cap), 
                 type = VALUES(type),
                 last_updated = VALUES(last_updated)`,
                [
                    cleanData.symbol, 
                    cleanData.price, 
                    cleanData.change_24h, 
                    cleanData.volume_24h, 
                    cleanData.market_cap, 
                    type, 
                    cleanData.last_updated
                ]
            );
        }
    } catch (error) {
        console.log('Error guardando datos de mercado:', error);
    }
}

// Obtener datos de criptomonedas
export async function getCryptoData(req, res) {
    try {
        // Intentar obtener datos de la base de datos primero
        const [cryptoData] = await pool.execute(
            'SELECT * FROM market_data WHERE type = "crypto" AND symbol IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ORDER BY market_cap DESC',
            ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'AVAX', 'MATIC']
        );

        // Si no hay datos o son muy antiguos (más de 10 minutos), obtener nuevos
        const isDataOld = cryptoData.length === 0 || 
            (new Date() - new Date(cryptoData[0].last_updated)) > 10 * 60 * 1000;

        if (isDataOld) {
            const freshData = await fetchCryptoDataFromAPI();
            await saveMarketData(freshData, 'crypto');
            
            // Obtener datos actualizados
            const [updatedData] = await pool.execute(
                'SELECT * FROM market_data WHERE type = "crypto" AND symbol IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ORDER BY market_cap DESC',
                ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'AVAX', 'MATIC']
            );
            
            return res.status(200).json({
                success: true,
                data: { crypto: updatedData }
            });
        }

        res.status(200).json({
            success: true,
            data: { crypto: cryptoData }
        });

    } catch (error) {
        console.log('Error obteniendo datos de crypto:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo datos de criptomonedas'
        });
    }
}

// Obtener datos de acciones
export async function getStocksData(req, res) {
    try {
        // Intentar obtener datos de la base de datos primero
        const [stocksData] = await pool.execute(
            'SELECT * FROM market_data WHERE type = "stocks" AND symbol IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ORDER BY market_cap DESC',
            ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
        );

        // Si no hay datos o son muy antiguos (más de 10 minutos), obtener nuevos
        const isDataOld = stocksData.length === 0 || 
            (new Date() - new Date(stocksData[0].last_updated)) > 10 * 60 * 1000;

        if (isDataOld) {
            const freshData = await fetchStocksDataFromAPI();
            await saveMarketData(freshData, 'stocks');
            
            // Obtener datos actualizados
            const [updatedData] = await pool.execute(
                'SELECT * FROM market_data WHERE type = "stocks" AND symbol IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ORDER BY market_cap DESC',
                ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC']
            );
            
            return res.status(200).json({
                success: true,
                data: { stocks: updatedData }
            });
        }

        res.status(200).json({
            success: true,
            data: { stocks: stocksData }
        });

    } catch (error) {
        console.log('Error obteniendo datos de acciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo datos de acciones'
        });
    }
}

// Obtener análisis de mercado con límites de IA
export async function getMarketAnalysis(req, res) {
    try {
        const user = req.user;
        const subscriptionType = user.subscriptionType || 'free';
        
        // Verificar límites de análisis
        const canAnalyze = await checkAnalysisLimits(user.userId, subscriptionType);
        
        if (!canAnalyze.allowed) {
            return res.status(429).json({
                success: false,
                message: canAnalyze.message,
                limits: canAnalyze.limits
            });
        }

        // Obtener datos de crypto y stocks
        const [cryptoData] = await pool.execute(
            'SELECT * FROM market_data WHERE type = "crypto" AND symbol IN (?, ?, ?, ?) ORDER BY change_24h DESC',
            ['BTC', 'ETH', 'BNB', 'XRP']
        );

        const [stocksData] = await pool.execute(
            'SELECT * FROM market_data WHERE type = "stocks" AND symbol IN (?, ?, ?, ?) ORDER BY change_24h DESC',
            ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
        );

        // Calcular tendencias
        const cryptoTrend = cryptoData.length > 0 ? 
            cryptoData.reduce((sum, coin) => sum + coin.change_24h, 0) / cryptoData.length : 0;
        
        const stocksTrend = stocksData.length > 0 ? 
            stocksData.reduce((sum, stock) => sum + stock.change_24h, 0) / stocksData.length : 0;

        // Análisis básico
        const analysis = {
            crypto: {
                trend: cryptoTrend,
                topGainer: cryptoData.find(coin => coin.change_24h === Math.max(...cryptoData.map(c => c.change_24h))),
                topLoser: cryptoData.find(coin => coin.change_24h === Math.min(...cryptoData.map(c => c.change_24h)))
            },
            stocks: {
                trend: stocksTrend,
                topGainer: stocksData.find(stock => stock.change_24h === Math.max(...stocksData.map(s => s.change_24h))),
                topLoser: stocksData.find(stock => stock.change_24h === Math.min(...stocksData.map(s => s.change_24h)))
            },
            marketSentiment: cryptoTrend > 0 && stocksTrend > 0 ? 'bullish' : 
                           cryptoTrend < 0 && stocksTrend < 0 ? 'bearish' : 'mixed',
            recommendations: generateRecommendations(cryptoTrend, stocksTrend, subscriptionType),
            timestamp: new Date().toISOString()
        };

        // Análisis con IA si está disponible
        try {
            const isOpenRouterAvailable = await openRouterService.isAvailable();
            if (isOpenRouterAvailable) {
                console.log('🤖 Generando análisis con OpenRouter...');
                const aiAnalysis = await openRouterService.analyzeMarket({
                    crypto: cryptoData,
                    stocks: stocksData
                });
                analysis.aiAnalysis = aiAnalysis;
                analysis.hasAIAnalysis = true;
            } else {
                console.log('⚠️ OpenRouter no disponible, usando análisis básico');
                analysis.hasAIAnalysis = false;
            }
        } catch (error) {
            console.error('❌ Error en análisis de IA:', error.message);
            analysis.hasAIAnalysis = false;
        }

        // Registrar uso de análisis
        await recordAnalysisUsage(user.userId, subscriptionType);

        res.status(200).json({
            success: true,
            data: { analysis }
        });

    } catch (error) {
        console.log('Error obteniendo análisis de mercado:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando análisis de mercado'
        });
    }
}

// Verificar límites de análisis
async function checkAnalysisLimits(userId, subscriptionType) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Obtener uso actual
        const [dailyUsage] = await pool.execute(
            'SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ? AND DATE(created_at) = ? AND type = "market_analysis"',
            [userId, today]
        );
        
        const [weeklyUsage] = await pool.execute(
            'SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ? AND DATE(created_at) >= ? AND type = "market_analysis"',
            [userId, weekStart]
        );

        const dailyCount = dailyUsage[0].count;
        const weeklyCount = weeklyUsage[0].count;

        let allowed = false;
        let message = '';
        let limits = {};

        switch (subscriptionType.toLowerCase()) {
            case 'free':
                allowed = dailyCount < 1;
                message = allowed ? 'Análisis disponible' : 'Límite diario alcanzado (1/día)';
                limits = { daily: 1, used: dailyCount, remaining: Math.max(0, 1 - dailyCount) };
                break;
            case 'premium':
                allowed = weeklyCount < 3;
                message = allowed ? 'Análisis disponible' : 'Límite semanal alcanzado (3/semana)';
                limits = { weekly: 3, used: weeklyCount, remaining: Math.max(0, 3 - weeklyCount) };
                break;
            case 'premium+':
                allowed = true;
                message = 'Análisis ilimitados';
                limits = { unlimited: true };
                break;
            default:
                allowed = false;
                message = 'Tipo de suscripción no válido';
        }

        return { allowed, message, limits };
    } catch (error) {
        console.error('❌ Error checking analysis limits:', error);
        return { allowed: false, message: 'Error verificando límites', limits: {} };
    }
}

// Registrar uso de análisis
async function recordAnalysisUsage(userId, subscriptionType) {
    try {
        await pool.execute(
            'INSERT INTO ai_usage (user_id, type, subscription_type, created_at) VALUES (?, "market_analysis", ?, NOW())',
            [userId, subscriptionType]
        );
    } catch (error) {
        console.error('❌ Error recording analysis usage:', error);
    }
}

// Generar recomendaciones según suscripción
function generateRecommendations(cryptoTrend, stocksTrend, subscriptionType) {
    const baseRecommendations = [
        'Diversifica tu portfolio entre diferentes activos',
        'Mantén un fondo de emergencia de 3-6 meses',
        'Invierte solo lo que puedes permitirte perder'
    ];

    if (subscriptionType === 'premium+') {
        return [
            ...baseRecommendations,
            'Considera estrategias de DCA (Dollar Cost Averaging)',
            'Evalúa oportunidades de arbitraje entre exchanges',
            'Monitorea indicadores técnicos avanzados',
            'Considera opciones de cobertura para proteger ganancias'
        ];
    }

    return baseRecommendations;
}

// Análisis personalizado para Premium+
export async function getPersonalizedAnalysis(req, res) {
    try {
        const user = req.user;
        const subscriptionType = user.subscriptionType || 'free';
        
        // Solo para Premium+
        if (subscriptionType !== 'premium+') {
            return res.status(403).json({
                success: false,
                message: 'Análisis personalizado solo disponible para Premium+'
            });
        }

        // Verificar límites de análisis
        const canAnalyze = await checkAnalysisLimits(user.userId, subscriptionType);
        
        if (!canAnalyze.allowed) {
            return res.status(429).json({
                success: false,
                message: canAnalyze.message,
                limits: canAnalyze.limits
            });
        }

        // Obtener datos del usuario
        const [userTransactions] = await pool.execute(
            'SELECT SUM(CASE WHEN type = "income" THEN amount ELSE -amount END) as balance FROM transactions WHERE user_id = ?',
            [user.userId]
        );

        const balance = userTransactions[0]?.balance || 0;

        // Obtener datos de mercado
        const [cryptoData] = await pool.execute(
            'SELECT * FROM market_data WHERE type = "crypto" ORDER BY market_cap DESC LIMIT 5'
        );
        const [stocksData] = await pool.execute(
            'SELECT * FROM market_data WHERE type = "stocks" ORDER BY market_cap DESC LIMIT 5'
        );

        // Análisis personalizado con OpenRouter
        try {
            const isOpenRouterAvailable = await openRouterService.isAvailable();
            if (isOpenRouterAvailable) {
                console.log('🤖 Generando análisis personalizado con OpenRouter...');
                
                const userProfile = {
                    balance: balance,
                    riskTolerance: 'medium', // Por defecto, se puede personalizar
                    investmentGoals: 'Crecimiento a largo plazo'
                };

                const personalizedAnalysis = await openRouterService.personalizedAnalysis(
                    userProfile,
                    { crypto: cryptoData, stocks: stocksData }
                );

                // Guardar análisis en BD
                await pool.execute(
                    'INSERT INTO personalized_analysis (user_id, balance, risk_tolerance, investment_goals, analysis_data, recommendations) VALUES (?, ?, ?, ?, ?, ?)',
                    [user.userId, balance, 'medium', 'Crecimiento a largo plazo', JSON.stringify({ crypto: cryptoData, stocks: stocksData }), personalizedAnalysis]
                );

                // Registrar uso de análisis
                await recordAnalysisUsage(user.userId, subscriptionType);

                res.status(200).json({
                    success: true,
                    data: {
                        analysis: personalizedAnalysis,
                        userProfile: userProfile,
                        marketData: { crypto: cryptoData, stocks: stocksData },
                        timestamp: new Date().toISOString()
                    }
                });
            } else {
                throw new Error('OpenRouter no disponible');
            }
        } catch (error) {
            console.error('❌ Error en análisis personalizado:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error generando análisis personalizado'
            });
        }

    } catch (error) {
        console.log('❌ Error obteniendo análisis personalizado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// Actualizar datos de mercado (para cron job)
export async function updateMarketData() {
    try {
        console.log('Actualizando datos de mercado...');
        
        // Obtener y guardar datos de crypto
        const cryptoData = await fetchCryptoDataFromAPI();
        await saveMarketData(cryptoData, 'crypto');
        
        // Obtener y guardar datos de stocks
        const stocksData = await fetchStocksDataFromAPI();
        await saveMarketData(stocksData, 'stocks');
        
        console.log('Datos de mercado actualizados exitosamente');
    } catch (error) {
        console.log('Error actualizando datos de mercado:', error);
    }
}
