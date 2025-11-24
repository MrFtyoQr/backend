import { pool } from '../config/db.js';

const VALID_TRANSACTION_TYPES = new Set(['income', 'expense']);

export async function getTransactionsByUserId(req, res) {
  try {
    const authenticatedUserId = req.user.userId;
    const requestedUserId = req.params.userId || authenticatedUserId;

    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [authenticatedUserId],
    );

    res.status(200).json(transactions);
  } catch (error) {
    console.log('Error getting the transactions', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createTransaction(req, res) {
  try {
    const { title, amount, category, type } = req.body;
    const userId = req.user.userId;

    if (!title || !category || amount === undefined || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!VALID_TRANSACTION_TYPES.has(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount)) {
      return res.status(400).json({ message: 'Amount must be numeric' });
    }

    const [result] = await pool.execute(
      'INSERT INTO transactions(user_id, title, amount, category, type) VALUES(?, ?, ?, ?, ?)',
      [userId, title, parsedAmount, category, type],
    );

    const [transaction] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [result.insertId, userId],
    );

    res.status(201).json(transaction[0]);
  } catch (error) {
    console.log('Error creating transaction', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const numericId = Number.parseInt(id, 10);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const [result] = await pool.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [numericId, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.log('Error deleting transaction', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const authenticatedUserId = req.user.userId;
    const requestedUserId = req.params.userId || authenticatedUserId;

    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [incomeResult] = await pool.execute(
      'SELECT COALESCE(SUM(amount),0) as income FROM transactions WHERE user_id = ? AND type = "income"',
      [authenticatedUserId],
    );

    const [expensesResult] = await pool.execute(
      'SELECT COALESCE(SUM(amount),0) as expenses FROM transactions WHERE user_id = ? AND type = "expense"',
      [authenticatedUserId],
    );

    // Balance = Ingresos - Gastos
    const balance = (incomeResult[0].income || 0) - (expensesResult[0].expenses || 0);

    res.status(200).json({
      balance: balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.log('Error getting summary', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
