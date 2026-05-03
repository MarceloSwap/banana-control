import "dotenv/config";
import bcrypt from "bcrypt";
import mysql from "mysql2/promise";

const dbName = process.env.DB_NAME || "banana_control";
const adminEmail = process.env.ADMIN_EMAIL || "admin@bananacontrol.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const seedSampleData = process.env.SEED_SAMPLE_DATA !== "false";

const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: false
};

async function columnExists(connection, table, column) {
  const [[row]] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [dbName, table, column]
  );
  return Number(row.total) > 0;
}

async function constraintExists(connection, constraintName) {
  const [[row]] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = ? AND CONSTRAINT_NAME = ?
    `,
    [dbName, constraintName]
  );
  return Number(row.total) > 0;
}

async function ensureUserIdColumn(connection, table, constraintName) {
  if (!(await columnExists(connection, table, "user_id"))) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN user_id INT NULL AFTER id`);
  }

  const [[admin]] = await connection.query("SELECT id FROM users WHERE email = ?", [adminEmail]);
  await connection.query(`UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`, [admin.id]);
  await connection.query(`ALTER TABLE ${table} MODIFY COLUMN user_id INT NOT NULL`);

  if (!(await constraintExists(connection, constraintName))) {
    await connection.query(
      `ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
    );
  }
}

async function ensureAdmin(connection) {
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await connection.query(
    `
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES ('Administrador', ?, ?, 'ADMIN', 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        role = 'ADMIN',
        status = 'ACTIVE'
    `,
    [adminEmail, passwordHash]
  );

  const [[admin]] = await connection.query("SELECT id FROM users WHERE email = ?", [adminEmail]);
  await connection.query(
    "INSERT INTO inventories (user_id, current_quantity) VALUES (?, 0) ON DUPLICATE KEY UPDATE current_quantity = current_quantity",
    [admin.id]
  );

  return admin.id;
}

async function ensureSampleProducer(connection) {
  const sampleEmail = "produtor@bananacontrol.com";
  const samplePasswordHash = await bcrypt.hash("produtor123", 10);

  await connection.query(
    `
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES ('Produtor Exemplo', ?, ?, 'USER', 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        role = 'USER',
        status = 'ACTIVE'
    `,
    [sampleEmail, samplePasswordHash]
  );

  const [[producer]] = await connection.query("SELECT id FROM users WHERE email = ?", [sampleEmail]);
  const [[countRow]] = await connection.query(
    `
      SELECT
        (SELECT COUNT(*) FROM expenses WHERE user_id = ?) +
        (SELECT COUNT(*) FROM sales WHERE user_id = ?) +
        (SELECT COUNT(*) FROM losses WHERE user_id = ?) AS total
    `,
    [producer.id, producer.id, producer.id]
  );

  if (Number(countRow.total) > 0) {
    return;
  }

  await connection.query(
    "INSERT INTO inventories (user_id, current_quantity) VALUES (?, 408) ON DUPLICATE KEY UPDATE current_quantity = VALUES(current_quantity)",
    [producer.id]
  );
  await connection.query(
    "INSERT INTO stock_movements (user_id, type, quantity, note) VALUES (?, 'INITIAL', 500, 'Carga inicial de exemplo')",
    [producer.id]
  );
  await connection.query(
    "INSERT INTO stock_movements (user_id, type, quantity, note) VALUES (?, 'SALE', 80, 'Venda de exemplo')",
    [producer.id]
  );
  await connection.query(
    "INSERT INTO stock_movements (user_id, type, quantity, note) VALUES (?, 'LOSS', 12, 'Perda de exemplo')",
    [producer.id]
  );
  await connection.query(
    "INSERT INTO expenses (user_id, type, amount, expense_date) VALUES (?, 'adubo', 120.00, CURDATE())",
    [producer.id]
  );
  await connection.query(
    "INSERT INTO sales (user_id, quantity, price, sale_date) VALUES (?, 80.00, 3.50, CURDATE())",
    [producer.id]
  );
  await connection.query(
    "INSERT INTO losses (user_id, quantity, reason, loss_date) VALUES (?, 12.00, 'transporte', CURDATE())",
    [producer.id]
  );
}

async function main() {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
        status ENUM('ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
        failed_login_attempts INT NOT NULL DEFAULT 0,
        locked_until DATETIME NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expires_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(80) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quantity DECIMAL(10, 2) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        sale_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS losses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quantity DECIMAL(10, 2) NOT NULL,
        reason VARCHAR(80) NOT NULL,
        loss_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventories (
        user_id INT PRIMARY KEY,
        current_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_inventories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await ensureAdmin(connection);
    await ensureUserIdColumn(connection, "expenses", "fk_expenses_user");
    await ensureUserIdColumn(connection, "sales", "fk_sales_user");
    await ensureUserIdColumn(connection, "losses", "fk_losses_user");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('INITIAL', 'ADD', 'SALE', 'LOSS') NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        note VARCHAR(180) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_stock_movements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    if (seedSampleData) {
      await ensureSampleProducer(connection);
    }

    console.log("Banco preparado com sucesso.");
    console.log(`Admin: ${adminEmail}`);
    console.log(`Senha: ${adminPassword}`);
    if (seedSampleData) {
      console.log("Produtor exemplo: produtor@bananacontrol.com / produtor123");
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Erro ao preparar o banco:", error.message);
  process.exit(1);
});
