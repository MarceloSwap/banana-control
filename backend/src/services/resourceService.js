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

function withUserFilter(filter, userId) {
  return {
    where: filter.where ? `${filter.where} AND user_id = ?` : "WHERE user_id = ?",
    values: [...filter.values, userId]
  };
}

async function assertEnoughStock(connection, userId, quantity) {
  const [[row]] = await connection.query(
    "SELECT current_quantity FROM inventories WHERE user_id = ? FOR UPDATE",
    [userId]
  );
  const currentQuantity = Number(row?.current_quantity || 0);

  if (Number(quantity) > currentQuantity) {
    const error = new Error("Estoque insuficiente para esta operação");
    error.status = 400;
    throw error;
  }
}

async function adjustStock(connection, userId, delta, type, note) {
  await connection.query(
    "INSERT INTO inventories (user_id, current_quantity) VALUES (?, 0) ON DUPLICATE KEY UPDATE current_quantity = current_quantity",
    [userId]
  );
  await connection.query(
    "UPDATE inventories SET current_quantity = current_quantity + ? WHERE user_id = ?",
    [delta, userId]
  );

  if (Number(delta) !== 0) {
    await connection.query(
      "INSERT INTO stock_movements (user_id, type, quantity, note) VALUES (?, ?, ?, ?)",
      [userId, type, Math.abs(Number(delta)), note]
    );
  }
}

export async function listResources(resource, query, userId) {
  const { table, select, dateColumn } = config[resource];
  const { where, values } = withUserFilter(buildFilters(resource, query), userId);
  const [rows] = await pool.query(
    `SELECT ${select} FROM ${table} ${where} ORDER BY ${dateColumn} DESC, id DESC`,
    values
  );
  return rows;
}

export async function createResource(resource, data, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (resource === "expenses") {
      const [result] = await connection.query(
        "INSERT INTO expenses (user_id, type, amount, expense_date) VALUES (?, ?, ?, ?)",
        [userId, data.type, data.amount, data.date]
      );
      await connection.commit();
      return result.insertId;
    }

    if (resource === "sales") {
      await assertEnoughStock(connection, userId, data.quantity);
      const [result] = await connection.query(
        "INSERT INTO sales (user_id, quantity, price, sale_date) VALUES (?, ?, ?, ?)",
        [userId, data.quantity, data.price, data.date]
      );
      await adjustStock(connection, userId, -Number(data.quantity), "SALE", "Venda registrada");
      await connection.commit();
      return result.insertId;
    }

    await assertEnoughStock(connection, userId, data.quantity);
    const [result] = await connection.query(
      "INSERT INTO losses (user_id, quantity, reason, loss_date) VALUES (?, ?, ?, ?)",
      [userId, data.quantity, data.reason, data.date]
    );
    await adjustStock(connection, userId, -Number(data.quantity), "LOSS", "Perda registrada");
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateResource(resource, id, data, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (resource === "expenses") {
      await connection.query(
        "UPDATE expenses SET type = ?, amount = ?, expense_date = ? WHERE id = ? AND user_id = ?",
        [data.type, data.amount, data.date, id, userId]
      );
      await connection.commit();
      return;
    }

    const { table } = config[resource];
    const [[existing]] = await connection.query(
      `SELECT quantity FROM ${table} WHERE id = ? AND user_id = ? FOR UPDATE`,
      [id, userId]
    );

    if (!existing) {
      const error = new Error("Registro nao encontrado.");
      error.status = 404;
      throw error;
    }

    const difference = Number(data.quantity) - Number(existing.quantity);
    if (difference > 0) {
      await assertEnoughStock(connection, userId, difference);
    }

    if (resource === "sales") {
      await connection.query(
        "UPDATE sales SET quantity = ?, price = ?, sale_date = ? WHERE id = ? AND user_id = ?",
        [data.quantity, data.price, data.date, id, userId]
      );
      await adjustStock(connection, userId, -difference, "SALE", "Ajuste de venda");
      await connection.commit();
      return;
    }

    await connection.query(
      "UPDATE losses SET quantity = ?, reason = ?, loss_date = ? WHERE id = ? AND user_id = ?",
      [data.quantity, data.reason, data.date, id, userId]
    );
    await adjustStock(connection, userId, -difference, "LOSS", "Ajuste de perda");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteResource(resource, id, userId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { table } = config[resource];
    let existing = null;

    if (resource === "sales" || resource === "losses") {
      [[existing]] = await connection.query(
        `SELECT quantity FROM ${table} WHERE id = ? AND user_id = ? FOR UPDATE`,
        [id, userId]
      );
    }

    await connection.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);

    if ((resource === "sales" || resource === "losses") && existing) {
      await adjustStock(
        connection,
        userId,
        Number(existing.quantity),
        resource === "sales" ? "SALE" : "LOSS",
        "Registro removido"
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function buildDateScope(query, columns) {
  const filters = {
    expenses: "",
    sales: "",
    losses: ""
  };
  const values = {
    expenses: [query.userId],
    sales: [query.userId],
    losses: [query.userId]
  };

  if (query.startDate && query.endDate) {
    Object.entries(columns).forEach(([key, column]) => {
      filters[key] = `AND ${column} BETWEEN ? AND ?`;
      values[key].push(query.startDate, query.endDate);
    });
    return { filters, values };
  }

  if (query.month) {
    Object.entries(columns).forEach(([key, column]) => {
      filters[key] = `AND DATE_FORMAT(${column}, '%Y-%m') = ?`;
      values[key].push(query.month);
    });
  }

  return { filters, values };
}

export async function getSummary(filtersQuery, userId) {
  const { filters, values } = buildDateScope(
    { ...filtersQuery, userId },
    { expenses: "expense_date", sales: "sale_date", losses: "loss_date" }
  );

  const [[expenseRow]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses WHERE user_id = ? ${filters.expenses}`,
    values.expenses
  );
  const [[saleRow]] = await pool.query(
    `SELECT COALESCE(SUM(quantity * price), 0) AS totalSales FROM sales WHERE user_id = ? ${filters.sales}`,
    values.sales
  );
  const [[lossRow]] = await pool.query(
    `SELECT COALESCE(SUM(quantity), 0) AS totalLosses FROM losses WHERE user_id = ? ${filters.losses}`,
    values.losses
  );
  const [[stockRow]] = await pool.query(
    "SELECT COALESCE(current_quantity, 0) AS currentStock FROM inventories WHERE user_id = ?",
    [userId]
  );

  return {
    totalExpenses: Number(expenseRow.totalExpenses),
    totalSales: Number(saleRow.totalSales),
    totalLosses: Number(lossRow.totalLosses),
    totalProfit: Number(saleRow.totalSales) - Number(expenseRow.totalExpenses),
    currentStock: Number(stockRow?.currentStock || 0)
  };
}

export async function getAnalytics(userId, filtersQuery = {}) {
  const { filters, values } = buildDateScope(
    { ...filtersQuery, userId },
    { expenses: "expense_date", sales: "sale_date", losses: "loss_date" }
  );

  const [monthlyRows] = await pool.query(`
    SELECT month_key, SUM(total_expenses) AS totalExpenses, SUM(total_sales) AS totalSales
    FROM (
      SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month_key, SUM(amount) AS total_expenses, 0 AS total_sales
      FROM expenses
      WHERE user_id = ? ${filters.expenses}
      GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
      UNION ALL
      SELECT DATE_FORMAT(sale_date, '%Y-%m') AS month_key, 0 AS total_expenses, SUM(quantity * price) AS total_sales
      FROM sales
      WHERE user_id = ? ${filters.sales}
      GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
    ) monthly_union
    GROUP BY month_key
    ORDER BY month_key ASC
  `, [...values.expenses, ...values.sales]);

  const [lossReasonRows] = await pool.query(`
    SELECT reason, COALESCE(SUM(quantity), 0) AS total
    FROM losses
    WHERE user_id = ? ${filters.losses}
    GROUP BY reason
    ORDER BY total DESC, reason ASC
  `, values.losses);

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

export async function addStock(userId, quantity) {
  if (!quantity || Number(quantity) <= 0) {
    const error = new Error("Quantidade deve ser maior que zero.");
    error.status = 400;
    throw error;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await adjustStock(connection, userId, Number(quantity), "ADD", "Adicao manual ao estoque");
    await connection.commit();
    const [[stockRow]] = await pool.query(
      "SELECT COALESCE(current_quantity, 0) AS currentStock FROM inventories WHERE user_id = ?",
      [userId]
    );
    return { currentStock: Number(stockRow.currentStock) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
