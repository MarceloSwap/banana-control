import "dotenv/config";
import mysql from "mysql2/promise";

const dbName = process.env.DB_NAME || "banana_control";

const expectedTables = ["users", "inventories", "stock_movements", "expenses", "sales", "losses"];
const expectedColumns = {
  users: ["id", "name", "email", "password_hash", "role", "status"],
  inventories: ["user_id", "current_quantity"],
  stock_movements: ["id", "user_id", "type", "quantity"],
  expenses: ["id", "user_id", "type", "amount", "expense_date"],
  sales: ["id", "user_id", "quantity", "price", "sale_date"],
  losses: ["id", "user_id", "quantity", "reason", "loss_date"]
};
const expectedConstraints = [
  "fk_expenses_user",
  "fk_sales_user",
  "fk_losses_user",
  "fk_inventories_user",
  "fk_stock_movements_user"
];

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  });

  try {
    const [tables] = await connection.query(
      `
        SELECT TABLE_NAME AS tableName
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
      `,
      [dbName]
    );
    const existingTables = new Set(tables.map((table) => table.tableName));

    console.log(`Banco: ${dbName}`);
    for (const table of expectedTables) {
      console.log(`${existingTables.has(table) ? "OK" : "FALTA"} tabela ${table}`);
    }

    for (const table of expectedTables.filter((name) => existingTables.has(name))) {
      const [columns] = await connection.query(
        `
          SELECT COLUMN_NAME AS columnName
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        `,
        [dbName, table]
      );
      const existingColumns = new Set(columns.map((column) => column.columnName));

      for (const column of expectedColumns[table]) {
        console.log(`${existingColumns.has(column) ? "OK" : "FALTA"} coluna ${table}.${column}`);
      }
    }

    const [constraints] = await connection.query(
      `
        SELECT CONSTRAINT_NAME AS constraintName
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `,
      [dbName]
    );
    const existingConstraints = new Set(constraints.map((constraint) => constraint.constraintName));

    for (const constraint of expectedConstraints) {
      console.log(`${existingConstraints.has(constraint) ? "OK" : "FALTA"} relacao ${constraint}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Erro ao verificar o banco:", error.message);
  process.exit(1);
});
