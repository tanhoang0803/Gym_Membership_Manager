const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gym.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedIfEmpty();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      location   TEXT    NOT NULL DEFAULT '',
      date       TEXT    NOT NULL DEFAULT (date('now')),
      status     TEXT    NOT NULL DEFAULT 'Pending'
                         CHECK(status IN ('Delivered','Shipped','Pending','Cancelled')),
      amount     REAL    NOT NULL DEFAULT 0.00,
      avatar     TEXT    NOT NULL DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TRIGGER IF NOT EXISTS members_updated_at
    AFTER UPDATE ON members
    BEGIN
      UPDATE members SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM members').get();
  if (count.c > 0) return;

  const insert = db.prepare(`
    INSERT INTO members (name, location, date, status, amount, avatar)
    VALUES (@name, @location, @date, @status, @amount, @avatar)
  `);

  const seed = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  seed([
    { name: 'Dwayne Johnson',   location: 'USA',      date: '2024-07-23', status: 'Delivered', amount: 128.56, avatar: 'images/Dwayne-Johnson.jpg'   },
    { name: 'Cristiano Ronaldo',location: 'Portland', date: '2024-07-23', status: 'Cancelled', amount: 122.26, avatar: 'images/Cristiano-Ronaldo.jpg' },
    { name: 'Gigi Hadid',       location: 'India',    date: '2024-07-23', status: 'Shipped',   amount: 115.89, avatar: 'images/Gigi-Hadid.jpg'        },
    { name: 'Justin Bieber',    location: 'Canada',   date: '2024-07-23', status: 'Delivered', amount: 150.46, avatar: 'images/Justin-Bieber.jpg'     },
    { name: 'Lionel Messi',     location: 'Argentina',date: '2024-07-23', status: 'Pending',   amount: 132.16, avatar: 'images/Lionel-Messi.jpg'      },
    { name: 'Robert Downey',    location: 'USA',      date: '2024-07-23', status: 'Cancelled', amount: 121.40, avatar: 'images/Robert-Downey.jpg'     },
  ]);
}

module.exports = { getDb };
