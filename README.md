# CP Club — Competitive Programming Community Platform

A full-stack, responsive web application for college students, mentors, and competitive programming communities. CP Club features real-time Codeforces API integration, mentor-curated problem sheets, peer leaderboards, timed virtual practice rooms, and student progress tracking.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (already configured in `.env`)

### 2. Run Database Seed (Optional)
To populate the database with initial users, curated problem sheets, sample practice rooms, and announcements:
```bash
npm run seed
```

### 3. Start Backend Server
```bash
# From root directory:
npm run server
# Server runs at http://localhost:5000 (connected to MongoDB Atlas)
```

### 4. Start React Frontend
```bash
# In a separate terminal:
npm run client
# Client runs at http://localhost:5173
```

---

## 👥 Demo Credentials

| Role | Email | Password | Codeforces Handle |
|---|---|---|---|
| **Admin** | `admin@cpclub.org` | `AdminPassword123!` | `@tourist` |
| **Mentor** | `mentor@cpclub.org` | `MentorPassword123!` | `@Petr` |
| **Student** | `student@cpclub.org` | `StudentPassword123!` | `@Benq` |

*(You can also register a new account at `/register` with your own Codeforces handle!)*

---

## 🌟 Key Features

1. **Authentication & Role-Based Authorization**
   - Secure HTTP-only JWT cookies with automatic token refresh.
   - Distinct roles: `student`, `mentor`, and `admin`.

2. **Official Codeforces Integration**
   - Live synchronization with Codeforces API (`user.info`, `user.rating`, `user.status`).
   - Dynamic rating color badges conforming to Codeforces tiers (Newbie, Pupil, Specialist, Expert, Candidate Master, Master, Grandmaster).
   - Rating history progression chart and verified accepted problem counter.

3. **Curated Problem Sheets**
   - Topic-based sheets (Implementation, DP, Graphs, etc.) with difficulty indicators.
   - Problem table with direct links to Codeforces problem sets.
   - Live "Verify CF" button that checks Codeforces submissions and updates progress in real time.

4. **Club Assignments & Progress Tracking**
   - Mentors assign problem sheets with deadlines and passing thresholds.
   - Real-time countdown timer with urgency styling.
   - Mentor progress report table tracking each student's pass/fail status.

5. **Competitive Leaderboards**
   - 4 ranking categories: Codeforces Rating, Weekly Solved Problems, Rating Improvement, and Total Solved.
   - Top 3 podium display (Gold, Silver, Bronze badges) and filterable ranking directory.

6. **Virtual Practice Rooms**
   - Timed contests with start and end timers.
   - Live problem set and participant scoreboard.

7. **Club Announcements**
   - Priority categorization (general, contest, workshop, deadline) with pinned posts.

8. **Admin Control Center**
   - Member management directory with one-click role promotions/demotions and account controls.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, MongoDB (Atlas), Mongoose, Zod, JWT, bcryptjs, Helmet, CORS, Rate Limit.
- **Frontend**: React (Vite), Tailwind CSS, React Router DOM, Recharts, Lucide Icons, Axios.
