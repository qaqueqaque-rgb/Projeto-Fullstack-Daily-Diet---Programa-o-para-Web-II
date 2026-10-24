const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../daily-diet.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

// Cria as tabelas caso ainda não existam.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    dentroDaDieta INTEGER NOT NULL CHECK (dentroDaDieta IN (0, 1)),
    userId INTEGER NOT NULL,
    FOREIGN KEY (userId)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// Adiciona as novas colunas sem excluir os registros existentes.
const colunas = db
  .prepare('PRAGMA table_info(users)')
  .all()
  .map((coluna) => coluna.name);

if (!colunas.includes('login')) {
  db.exec('ALTER TABLE users ADD COLUMN login TEXT');
}

if (!colunas.includes('senhaHash')) {
  db.exec('ALTER TABLE users ADD COLUMN senhaHash TEXT');
}

// Impede que dois usuários tenham o mesmo login.
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_unique
  ON users(login COLLATE NOCASE)
  WHERE login IS NOT NULL;
`);

module.exports = db;