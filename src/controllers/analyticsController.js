import { pool } from '../config/db.js';

const DEFAULT_DASHBOARD_DAYS = 30;
const TREND_PERIODS = new Set(['week', 'month', 'year']);
const COMPARISON_INTERVAL = {
  week: 'WEEK',
  month: 'MONTH',
  year: 'YEAR',
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const isValidDate = (value) => {
  return !Number.isNaN(Date.parse(value));
};

// Dashboard principal
export async function getDashboard(req, res) {
  try {
    const userId = req.user.userId;
    const { period = String(DEFAULT_DASHBOARD_DAYS) } = req.query;

    const days = parsePositiveInt(period, DEFAULT_DASHBOARD_DAYS);

    const [summary] = await pool.execute(
      `
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
                COALESCE(SUM(amount), 0) as balance,
                COUNT(*) as total_transactions
            FROM transactions 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `,
      [userId, days],
    );

    const [categories] = await pool.execute(
      `
            SELECT 
                category,
                type,
                SUM(amount) as total,
                COUNT(*) as count
            FROM transactions 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY category, type
            ORDER BY total DESC
        `,
      [userId, days],
    );

    const [recentTransactions] = await pool.execute(
      `
            SELECT * FROM transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        `,
      [userId],
    );

    const [dailyTrend] = await pool.execute(
      `
            SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
            FROM transactions 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `,
      [userId],
    );

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0],
        categories,
        recentTransactions,
        dailyTrend,
      },
    });
  } catch (error) {
    console.log('Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}

// Tendencias temporales
export async function getTrends(req, res) {
  try {
    const userId = req.user.userId;
    const { period = 'month', startDate, endDate } = req.query;

    if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
      });
    }

    const normalizedPeriod = TREND_PERIODS.has(period) ? period : 'month';

    let dateFilter = '';
    const params = [userId];

    if (startDate && endDate) {
      dateFilter = 'AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      switch (normalizedPeriod) {
        case 'week':
          dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'year':
          dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
          break;
        case 'month':
        default:
          dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
          break;
      }
    }

    const groupBy = normalizedPeriod === 'year'
      ? "DATE_FORMAT(created_at, '%Y-%m')"
      : 'DATE(created_at)';

    const [trends] = await pool.execute(
      `
            SELECT 
                ${groupBy} as period,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
                SUM(amount) as balance,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE user_id = ? ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period
        `,
      params,
    );

    const comparisonUnit = COMPARISON_INTERVAL[normalizedPeriod] || 'MONTH';

    const [comparison] = await pool.execute(
      `
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
            FROM transactions 
            WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL 1 ${comparisonUnit})
        `,
      [userId],
    );

    res.status(200).json({
      success: true,
      data: {
        trends,
        comparison: comparison[0],
      },
    });
  } catch (error) {
    console.log('Error obteniendo tendencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}

// Categorías y demás funciones permanecen sin cambios
export async function getCategoryAnalysis(req, res) {
    try {
        const userId = req.user.userId;
        const { period = '30' } = req.query;

        const days = parsePositiveInt(period, DEFAULT_DASHBOARD_DAYS);

        const [categories] = await pool.execute(`
            SELECT 
                category,
                type,
                SUM(amount) as total,
                COUNT(*) as count,
                AVG(amount) as average,
                MAX(amount) as max,
                MIN(amount) as min
            FROM transactions 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY category, type
            ORDER BY total DESC
        `, [userId, days]);

        res.status(200).json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        console.log('Error obteniendo análisis por categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
export async function getPredictions(req, res) {
    try {
        const userId = req.user.userId;

        const [historicalData] = await pool.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
            FROM transactions 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month
        `, [userId]);

        const avgIncome = historicalData.length > 0 ? 
            historicalData.reduce((sum, item) => sum + item.income, 0) / historicalData.length : 0;
        
        const avgExpenses = historicalData.length > 0 ? 
            historicalData.reduce((sum, item) => sum + item.expenses, 0) / historicalData.length : 0;

        const predictions = {
            nextMonth: {
                predictedIncome: avgIncome,
                predictedExpenses: avgExpenses,
                predictedBalance: avgIncome - avgExpenses
            },
            nextQuarter: {
                predictedIncome: avgIncome * 3,
                predictedExpenses: avgExpenses * 3,
                predictedBalance: (avgIncome - avgExpenses) * 3
            },
            trends: {
                incomeTrend: historicalData.length > 1 ? 
                    ((historicalData[historicalData.length - 1].income - historicalData[0].income) / historicalData[0].income) * 100 : 0,
                expenseTrend: historicalData.length > 1 ? 
                    ((historicalData[historicalData.length - 1].expenses - historicalData[0].expenses) / historicalData[0].expenses) * 100 : 0
            }
        };

        res.status(200).json({
            success: true,
            data: {
                predictions,
                historicalData
            }
        });

    } catch (error) {
        console.log('Error obteniendo predicciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

export async function getMonthlyReport(req, res) {
    try {
        const userId = req.user.userId;
        const { year, month } = req.query;

        const targetYear = year || new Date().getFullYear();
        const targetMonth = month || new Date().getMonth() + 1;

        const [monthlySummary] = await pool.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
                COALESCE(SUM(amount), 0) as balance,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?
        `, [userId, targetYear, targetMonth]);

        const [previousMonth] = await pool.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
            FROM transactions 
            WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?
        `, [userId, targetYear, targetMonth - 1]);

        const [categoryBreakdown] = await pool.execute(`
            SELECT 
                category,
                SUM(amount) as total,
                COUNT(*) as count
            FROM transactions 
            WHERE user_id = ? AND type = 'expense' AND YEAR(created_at) = ? AND MONTH(created_at) = ?
            GROUP BY category
            ORDER BY total DESC
        `, [userId, targetYear, targetMonth]);

        const [topTransactions] = await pool.execute(`
            SELECT * FROM transactions 
            WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?
            ORDER BY ABS(amount) DESC
            LIMIT 10
        `, [userId, targetYear, targetMonth]);

        res.status(200).json({
            success: true,
            data: {
                summary: monthlySummary[0],
                comparison: {
                    incomeChange: previousMonth[0].income > 0 ? 
                        ((monthlySummary[0].income - previousMonth[0].income) / previousMonth[0].income) * 100 : 0,
                    expenseChange: previousMonth[0].expenses > 0 ? 
                        ((monthlySummary[0].expenses - previousMonth[0].expenses) / previousMonth[0].expenses) * 100 : 0
                },
                categoryBreakdown,
                topTransactions
            }
        });

    } catch (error) {
        console.log('Error obteniendo reporte mensual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

