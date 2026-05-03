import { pool } from "../db/pool.js";
import { registerUser } from "./authService.js";

export async function getAdminDashboard() {
  const [[userTotals]] = await pool.query(`
    SELECT
      COUNT(*) AS totalUsers,
      SUM(status = 'ACTIVE') AS activeUsers,
      SUM(status <> 'ACTIVE') AS inactiveUsers
    FROM users
    WHERE role = 'USER'
  `);

  const [[stockTotals]] = await pool.query(`
    SELECT COALESCE(SUM(current_quantity), 0) AS totalBananas
    FROM inventories
    INNER JOIN users ON users.id = inventories.user_id
    WHERE users.role = 'USER'
  `);

  const [registrationRows] = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS total
    FROM users
    WHERE role = 'USER' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);

  return {
    users: {
      total: Number(userTotals.totalUsers || 0),
      active: Number(userTotals.activeUsers || 0),
      inactive: Number(userTotals.inactiveUsers || 0)
    },
    totalBananas: Number(stockTotals.totalBananas || 0),
    registrationsLast30Days: registrationRows.map((row) => ({
      date: row.date,
      total: Number(row.total)
    }))
  };
}

export async function listProducers() {
  const [rows] = await pool.query(`
    SELECT id, name, email, status, created_at AS createdAt
    FROM users
    WHERE role = 'USER'
    ORDER BY created_at DESC
  `);
  return rows;
}

export async function blockProducer(id) {
  await pool.query("UPDATE users SET status = 'BLOCKED' WHERE id = ? AND role = 'USER'", [id]);
}

export async function deleteProducer(id) {
  await pool.query("DELETE FROM users WHERE id = ? AND role = 'USER'", [id]);
}

export async function createAdmin(payload) {
  return registerUser(payload, "ADMIN");
}

export async function getAdminReports() {
  const [[totals]] = await pool.query(`
    SELECT
      COALESCE((SELECT SUM(inventories.current_quantity)
        FROM inventories INNER JOIN users ON users.id = inventories.user_id
        WHERE users.role = 'USER'), 0) AS totalBananas,
      COALESCE((SELECT SUM(expenses.amount)
        FROM expenses INNER JOIN users ON users.id = expenses.user_id
        WHERE users.role = 'USER'), 0) AS totalExpenses,
      COALESCE((SELECT SUM(sales.quantity * sales.price)
        FROM sales INNER JOIN users ON users.id = sales.user_id
        WHERE users.role = 'USER'), 0) AS totalSales,
      COALESCE((SELECT SUM(losses.quantity)
        FROM losses INNER JOIN users ON users.id = losses.user_id
        WHERE users.role = 'USER'), 0) AS totalLosses
  `);

  const [lossesByReason] = await pool.query(`
    SELECT losses.reason, COALESCE(SUM(losses.quantity), 0) AS total
    FROM losses
    INNER JOIN users ON users.id = losses.user_id
    WHERE users.role = 'USER'
    GROUP BY losses.reason
    ORDER BY total DESC
  `);

  const [userGrowth] = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS total
    FROM users
    WHERE role = 'USER' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);

  const [monthlyFinance] = await pool.query(`
    SELECT month, SUM(expenses) AS expenses, SUM(sales) AS sales
    FROM (
      SELECT DATE_FORMAT(expenses.expense_date, '%Y-%m') AS month, SUM(expenses.amount) AS expenses, 0 AS sales
      FROM expenses
      INNER JOIN users ON users.id = expenses.user_id
      WHERE users.role = 'USER'
      GROUP BY DATE_FORMAT(expenses.expense_date, '%Y-%m')
      UNION ALL
      SELECT DATE_FORMAT(sales.sale_date, '%Y-%m') AS month, 0 AS expenses, SUM(sales.quantity * sales.price) AS sales
      FROM sales
      INNER JOIN users ON users.id = sales.user_id
      WHERE users.role = 'USER'
      GROUP BY DATE_FORMAT(sales.sale_date, '%Y-%m')
    ) finance
    GROUP BY month
    ORDER BY month
  `);

  return {
    totals: {
      totalBananas: Number(totals.totalBananas || 0),
      totalExpenses: Number(totals.totalExpenses || 0),
      totalSales: Number(totals.totalSales || 0),
      totalLosses: Number(totals.totalLosses || 0)
    },
    lossesByReason: lossesByReason.map((row) => ({ reason: row.reason, total: Number(row.total) })),
    userGrowth: userGrowth.map((row) => ({ date: row.date, total: Number(row.total) })),
    monthlyFinance: monthlyFinance.map((row) => ({
      month: row.month,
      expenses: Number(row.expenses || 0),
      sales: Number(row.sales || 0)
    }))
  };
}
