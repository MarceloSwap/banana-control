import { pool } from "../db/pool.js";

const config = {
  expenses: {
    table: "expenses",
    dateColumn: "expense_date",
    select: "id, type, amount, expense_date AS date, created_at"
  },
  sales: {
    table: "sales",
    dateColumn: "sale_date",
    select: "id, quantity, price, (quantity * price) AS total, sale_date AS date, created_at"
  },
  losses: {
    table: "losses",
    dateColumn: "loss_date",
    select: "id, quantity, reason, loss_date AS date, created_at"
  }
};

function buildFilters(resource, query) {
  const { dateColumn } = config[resource];
  const clauses = [];
  const values = [];

  if (query.startDate) {
    clauses.push(`${dateColumn} >= ?`);
    values.push(query.startDate);
  }

  if (query.endDate) {
    clauses.push(`${dateColumn} <= ?`);
    values.push(query.endDate);
  }

  if (resource === "expenses" && query.type) {
    clauses.push("type = ?");
    values.push(query.type);
  }

  if (resource === "losses" && query.reason) {
    clauses.push("reason = ?");
    values.push(query.reason);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values
  };
}

export async function listResources(resource, query) {
  const { table, select, dateColumn } = config[resource];
  const { where, values } = buildFilters(resource, query);
  const [rows] = await pool.query(
    `SELECT ${select} FROM ${table} ${where} ORDER BY ${dateColumn} DESC, id DESC`,
    values
  );
  return rows;
}

export async function createResource(resource, data) {
  if (resource === "expenses") {
    const [result] = await pool.query(
      "INSERT INTO expenses (type, amount, expense_date) VALUES (?, ?, ?)",
      [data.type, data.amount, data.date]
    );
    return result.insertId;
  }

  if (resource === "sales") {
    const [result] = await pool.query(
      "INSERT INTO sales (quantity, price, sale_date) VALUES (?, ?, ?)",
      [data.quantity, data.price, data.date]
    );
    return result.insertId;
  }

  const [result] = await pool.query(
    "INSERT INTO losses (quantity, reason, loss_date) VALUES (?, ?, ?)",
    [data.quantity, data.reason, data.date]
  );
  return result.insertId;
}

export async function updateResource(resource, id, data) {
  if (resource === "expenses") {
    await pool.query(
      "UPDATE expenses SET type = ?, amount = ?, expense_date = ? WHERE id = ?",
      [data.type, data.amount, data.date, id]
    );
    return;
  }

  if (resource === "sales") {
    await pool.query(
      "UPDATE sales SET quantity = ?, price = ?, sale_date = ? WHERE id = ?",
      [data.quantity, data.price, data.date, id]
    );
    return;
  }

  await pool.query(
    "UPDATE losses SET quantity = ?, reason = ?, loss_date = ? WHERE id = ?",
    [data.quantity, data.reason, data.date, id]
  );
}

export async function deleteResource(resource, id) {
  const { table } = config[resource];
  await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export async function getSummary(month) {
  const monthFilter = month ? "WHERE DATE_FORMAT(expense_date, '%Y-%m') = ?" : "";
  const saleFilter = month ? "WHERE DATE_FORMAT(sale_date, '%Y-%m') = ?" : "";
  const lossFilter = month ? "WHERE DATE_FORMAT(loss_date, '%Y-%m') = ?" : "";
  const values = month ? [month] : [];

  const [[expenseRow]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses ${monthFilter}`,
    values
  );
  const [[saleRow]] = await pool.query(
    `SELECT COALESCE(SUM(quantity * price), 0) AS totalSales FROM sales ${saleFilter}`,
    values
  );
  const [[lossRow]] = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0) AS totalLosses FROM losses ${lossFilter}`,
    values
  );

  return {
    totalExpenses: Number(expenseRow.totalExpenses),
    totalSales: Number(saleRow.totalSales),
    totalLosses: Number(lossRow.totalLosses),
    totalProfit: Number(saleRow.totalSales) - Number(expenseRow.totalExpenses)
  };
}

export async function getAnalytics() {
  const [monthlyRows] = await pool.query(`
    SELECT month_key, SUM(total_expenses) AS totalExpenses, SUM(total_sales) AS totalSales
    FROM (
      SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month_key, SUM(amount) AS total_expenses, 0 AS total_sales
      FROM expenses
      GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
      UNION ALL
      SELECT DATE_FORMAT(sale_date, '%Y-%m') AS month_key, 0 AS total_expenses, SUM(quantity * price) AS total_sales
      FROM sales
      GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
    ) monthly_union
    GROUP BY month_key
    ORDER BY month_key ASC
  `);

  const [lossReasonRows] = await pool.query(`
    SELECT reason, COALESCE(SUM(quantity), 0) AS total
    FROM losses
    GROUP BY reason
    ORDER BY total DESC, reason ASC
  `);

  return {
    monthly: monthlyRows.map((row) => ({
      month: row.month_key,
      totalExpenses: Number(row.totalExpenses),
      totalSales: Number(row.totalSales),
      totalProfit: Number(row.totalSales) - Number(row.totalExpenses)
    })),
    lossesByReason: lossReasonRows.map((row) => ({
      reason: row.reason,
      total: Number(row.total)
    }))
  };
}
