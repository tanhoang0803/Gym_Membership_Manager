# CLAUDE.md — Gym Membership Manager

Architecture and development guide for AI assistance.

---

## Project Overview

Full-stack gym membership CRUD application.
- **Frontend**: Vanilla HTML/CSS/JS (glass-morphism UI, no framework)
- **Backend**: Node.js + Express (REST API)
- **Database**: SQLite via `better-sqlite3`

---

## Directory Structure

```
table/
├── index.html              # Single-page frontend (SPA-style)
├── css/style.css           # All styles — glass-morphism, modals, badges, toasts
├── js/app.js               # All frontend logic — fetch, CRUD, sort, search, toast
├── backend/
│   ├── server.js           # Express entry point, serves static + API routes
│   ├── database.js         # SQLite init, schema, seed data, getDb() singleton
│   └── routes/
│       └── members.js      # All /api/members route handlers (CRUD + stats)
├── images/                 # Member avatar photos
├── gym.db                  # SQLite database (auto-created on first run)
├── package.json            # Dependencies: express, better-sqlite3, cors, nodemon
├── README.md               # User-facing documentation
└── CLAUDE.md               # This file
```

---

## Backend Architecture

### `backend/server.js`
- Express app on port 3000 (configurable via `process.env.PORT`)
- Middleware: `cors()`, `express.json()`, `express.static('..')`
- Routes mounted at `/api/members`
- Fallback: non-API routes serve `index.html`

### `backend/database.js`
- Exports `getDb()` — lazy singleton for `better-sqlite3` instance
- `initSchema()` — creates `members` table + `updated_at` trigger
- `seedIfEmpty()` — populates 6 sample rows if table is empty
- DB file: `gym.db` in project root

### `backend/routes/members.js`
| Method | Path               | Description                        |
|--------|--------------------|------------------------------------|
| GET    | /api/members/stats | Aggregate counts + total revenue   |
| GET    | /api/members       | List all (search, status, sort)    |
| GET    | /api/members/:id   | Single member by ID                |
| POST   | /api/members       | Create new member                  |
| PUT    | /api/members/:id   | Update member (partial OK)         |
| DELETE | /api/members/:id   | Delete member                      |

**Query params for GET /api/members:**
- `?search=text` — LIKE filter on name and location
- `?status=Pending` — exact status filter
- `?sort=name&order=desc` — column sort (whitelist validated)

**Validation:**
- `name` required and non-empty
- `status` must be one of: `Delivered`, `Shipped`, `Pending`, `Cancelled`
- `amount` cast to float
- Sort column whitelist: `id`, `name`, `location`, `date`, `status`, `amount`

---

## Frontend Architecture

### `index.html`
Sections:
1. `<header>` — branding + nav links
2. `#About` — gym description section
3. `#Content` — stats bar + table controls + data table
4. `<footer id="Contact">`
5. `#memberModal` — add/edit modal (hidden by default)
6. `#deleteModal` — delete confirmation modal
7. `#toastContainer` — toast notification mount point

### `js/app.js`
State:
- `sortCol`, `sortOrder` — current table sort
- `deleteTargetId` — pending delete ID

Key functions:
- `loadStats()` — fetches `/api/members/stats`, updates stat cards
- `loadMembers()` — fetches members with current search/filter/sort, calls `renderTable()`
- `renderTable(members)` — builds `<tbody>` rows with escape, format, status badge
- `openEditModal(id)` — fetches single member, populates form, opens modal
- `openDeleteModal(id, name)` — sets target, opens confirm modal
- Form submit handler — POST or PUT based on `memberId` hidden field
- Delete confirm handler — DELETE then reload
- `showToast(msg, type)` — appends toast div, auto-removes after 3s

### `css/style.css`
Design tokens (CSS variables in `:root`):
- Status badge colors: `--clr-delivered`, `--clr-cancelled`, `--clr-pending`, `--clr-shipped`
- Button colors: `--clr-btn-add`, `--clr-btn-save`, `--clr-btn-danger`, `--clr-btn-cancel`
- `--glass-bg`, `--glass-header`, `--glass-body` — backdrop-blur layers
- `--shadow`, `--radius` — reusable values

Key CSS sections: RESET → HEADER → MAIN → ABOUT → STATS BAR → CONTENT → TABLE → BADGES → BUTTONS → SKELETON → MODAL → TOAST → FOOTER → RESPONSIVE

---

## Database Schema

```sql
CREATE TABLE members (
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
```

Trigger `members_updated_at` auto-updates `updated_at` on every UPDATE.

---

## Running the Project

```bash
npm install          # install dependencies
npm start            # start server (http://localhost:3000)
npm run dev          # start with nodemon (auto-restart)
```

The Express server serves the static frontend files AND the API, so the browser only needs to open `http://localhost:3000`.

---

## Conventions

- **No frontend framework** — pure ES6+ JS, no build step needed
- **No ORM** — raw SQL via `better-sqlite3` prepared statements
- **Synchronous DB** — `better-sqlite3` is sync; no async/await in route handlers for DB ops
- **Parameterized queries everywhere** — no string interpolation in SQL
- **Sort whitelist** — column names validated against a fixed array before interpolation
- **XSS prevention** — all user strings run through `escHtml()` before inserting into DOM
- **Status values** — enforced at DB level via CHECK constraint AND at API level

---

## Common Tasks

### Add a new field to members
1. Add column in `initSchema()` in `database.js`
2. Update seed rows in `seedIfEmpty()`
3. Add field to POST/PUT handlers in `routes/members.js`
4. Add form input in `#memberModal` in `index.html`
5. Populate field in `openEditModal()` in `app.js`
6. Include in `payload` in form submit handler in `app.js`
7. Add `<th>` and `<td>` in table render

### Add a new status type
1. Update CHECK constraint in schema (requires DB migration or recreating `gym.db`)
2. Add to `validStatuses` array in both POST and PUT handlers
3. Add `<option>` in `#fStatus` and `#filterStatus` in `index.html`
4. Add CSS class and color vars in `style.css`
5. Add mapping in `statusClass()` in `app.js`

### Deploy
- Set `PORT` env variable for the server
- Use a process manager like `pm2` for production
- Consider migrating SQLite to PostgreSQL for concurrent writes at scale
