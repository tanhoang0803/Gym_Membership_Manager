# Gym Membership Manager

A full-stack gym membership management system with a modern glass-morphism UI, RESTful API backend, and SQLite database — built for real-world use.

**Live Demo:** [https://tanhoang0803.github.io/Gym_Membership_Manager/](https://tanhoang0803.github.io/Gym_Membership_Manager/)
**Repository:** [https://github.com/tanhoang0803/Gym_Membership_Manager](https://github.com/tanhoang0803/Gym_Membership_Manager)

> Note: The live demo shows the static UI. For full CRUD functionality with the backend, run `npm start` locally.

---

## Features

### Frontend
- **Live Data Table** — Member records loaded dynamically from the backend
- **Add Member** — Modal form to create a new member
- **Edit Member** — Inline modal to update any record
- **Delete Member** — Confirmation-guarded delete
- **Search & Filter** — Real-time search by name, location, or status
- **Column Sorting** — Click any header to sort ascending/descending
- **Status Badges** — Color-coded: Delivered, Shipped, Pending, Cancelled
- **Toast Notifications** — Success/error feedback after every action
- **Loading Skeleton** — Smooth loading states for async operations
- **Responsive Design** — Works on desktop, tablet, and mobile

### Backend (REST API)
- `GET    /api/members`       — List all members (with optional search/filter/sort)
- `POST   /api/members`       — Create a new member
- `PUT    /api/members/:id`   — Update a member
- `DELETE /api/members/:id`   — Delete a member
- `GET    /api/members/stats` — Dashboard statistics (total, by status)

### Database
- **SQLite** — Zero-config, file-based database (`gym.db`)
- Auto-created and seeded on first run
- Full persistence across server restarts

---

## Tech Stack

| Layer    | Technology                     |
|----------|-------------------------------|
| Frontend | HTML5, CSS3 (Glass-morphism), Vanilla JavaScript (ES6+) |
| Backend  | Node.js, Express.js            |
| Database | SQLite3 (`better-sqlite3`)     |
| API      | REST (JSON)                    |
| Dev Tool | nodemon (optional)             |

---

## Project Structure

```
table/
├── index.html          # Main UI (SPA-style frontend)
├── css/
│   └── style.css       # Styles — glass-morphism, responsive, badges
├── js/
│   └── app.js          # Frontend logic — fetch, CRUD, search, sort
├── backend/
│   ├── server.js       # Express app entry point
│   ├── database.js     # SQLite setup, seed data, query helpers
│   └── routes/
│       └── members.js  # API route handlers
├── images/             # Member profile photos
├── gym.db              # SQLite database file (auto-generated)
├── package.json        # Node dependencies
├── README.md           # This file
└── CLAUDE.md           # Architecture guide for AI assistance
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node.js)

### Installation

```bash
# 1. Navigate to the project directory
cd table

# 2. Install dependencies
npm install

# 3. Start the backend server
npm start
# Server runs on http://localhost:3000

# 4. Open the frontend
# Visit http://localhost:3000 in your browser
# (The Express server serves the static frontend)
```

### Development Mode (auto-restart)
```bash
npm run dev
```

---

## API Reference

### GET `/api/members`
Returns all members. Supports query params:
- `?search=name` — filter by name/location
- `?status=Delivered` — filter by status
- `?sort=name&order=asc` — sort results

**Response:**
```json
[
  {
    "id": 1,
    "name": "Dwayne Johnson",
    "location": "USA",
    "date": "2024-07-23",
    "status": "Delivered",
    "amount": 128.56,
    "avatar": "images/Dwayne-Johnson.jpg"
  }
]
```

### POST `/api/members`
Create a new member.

**Body:**
```json
{
  "name": "John Doe",
  "location": "New York",
  "status": "Pending",
  "amount": 99.99
}
```

### PUT `/api/members/:id`
Update an existing member by ID.

### DELETE `/api/members/:id`
Delete a member by ID.

### GET `/api/members/stats`
Dashboard aggregates.

**Response:**
```json
{
  "total": 6,
  "delivered": 2,
  "shipped": 1,
  "pending": 1,
  "cancelled": 2,
  "totalRevenue": 770.73
}
```

---

## Screenshots

| Section | Description |
|---------|-------------|
| Header  | Navigation bar with gym branding |
| Stats Row | Live counts of member statuses |
| Member Table | Sortable, searchable table with avatar + status badges |
| Add/Edit Modal | Clean form with validation |
| Toast Notification | Success/error feedback |

---

## Author

**TanQHoang** — Created July 2024
Full-stack upgrade: backend + database added March 2026

---

## License

MIT — Free to use and modify.
