# CP Club — Competitive Programming Community Platform

> **End-Term Software Project Submission**  
> A production-grade, full-stack web application designed for collegiate competitive programming clubs, mentors, and students. Enables automated Codeforces profile synchronization, mentor-curated practice sheets, time-constrained virtual contest rooms, interactive rating progression analytics, and peer leaderboards.

---

## 📌 Table of Contents
- [1. Problem Statement](#1-problem-statement)
- [2. Target Users](#2-target-users)
- [3. Proposed Solution](#3-proposed-solution)
- [4. Key Workflows & Features](#4-key-workflows--features)
- [5. System Architecture](#5-system-architecture)
- [6. Technology Stack](#6-technology-stack)
- [7. Engineering Depth & Technical Decisions](#7-engineering-depth--technical-decisions)
- [8. Security & Error Handling](#8-security--error-handling)
- [9. Local Setup & Installation](#9-local-setup--installation)
- [10. Environment Variables](#10-environment-variables)
- [11. Demo Credentials](#11-demo-credentials)
- [12. Deployment Links & Access](#12-deployment-links--access)
- [13. Demo Video](#13-demo-video)

---

## 1. Problem Statement
College competitive programming (CP) clubs and student cohorts face persistent hurdles:
1. **Fragmented Progress Tracking**: Mentors manually request screenshots or handle links to verify if students solved assigned problems.
2. **Lack of Automated Verification**: Without external platform integration, verifying whether a student genuinely submitted and passed an official test set requires manual cross-checking.
3. **No Centralized Practice Environment**: Clubs lack a dedicated platform for structured curriculum sheets, synchronized practice rooms with timers, and localized club leaderboards.
4. **Stale Engagement**: Without real-time community rankings, weekly problem-solving races, and visual rating trajectories, student motivation drops over time.

---

## 2. Target Users
- **Club Students & CP Aspirants**: Want structured problem sheets, automated submission checks, personal rating progress graphs, and community competition.
- **Club Mentors / Leads**: Need tools to curate topic-wise problem sets, assign homework with strict deadlines, set passing criteria, and monitor cohort completion reports.
- **Club Administrators**: Oversee club members, promote mentors, manage announcements, and moderate platform activity.

---

## 3. Proposed Solution
**CP Club** automates the entire club lifecycle:
- Directly connects each member's account to their official **Codeforces handle**.
- Polls and syncs official Codeforces submission data (`user.info`, `user.rating`, `user.status`) on demand and via scheduled intervals with in-memory caching to avoid rate-limiting.
- Provides interactive visual analytics (interactive rating charts with round-number scaling and hover metrics).
- Offers multi-role authorization (Student, Mentor, Admin) with granular permission boundaries.

---

## 4. Key Workflows & Features

### 🔄 Core User Workflows
1. **Student Onboarding & Verification**:
   - Register account with email, password, and Codeforces handle.
   - Profile automatically fetches current rating, max rating, avatar, rank tier, and solves.
   - Personal Dashboard renders custom interactive rating chart and weekly progress stats.

2. **Curated Sheet Practice & Automated Verification**:
   - Students open curated sheets (e.g., Dynamic Programming, Trees, Graphs).
   - Clicking **"Verify CF"** triggers backend verification against Codeforces submission APIs, recording accepted submissions to the user's permanent club records.

3. **Cohort Assignments & Deadlines**:
   - Mentors create assignments linking existing sheets with due dates and required solve thresholds.
   - Students view real-time countdown badges and auto-updating progress bars.
   - Mentors view a cohort-wide completion matrix with pass/fail status.

4. **Synchronized Virtual Practice Rooms**:
   - Users join timed contest rooms with live countdown clocks and linked problem sets.
   - Real-time participant tracking and scoreboard calculation.

5. **Multi-Category Club Leaderboards**:
   - Filterable rankings across:
     - **Codeforces Rating** (with Codeforces color-coded badges)
     - **Weekly Solved Problems**
     - **Rating Improvement**
     - **Total Solved Problems**
   - Responsive podium displaying Top 3 with Gold, Silver, and Bronze badges.

6. **Admin Member Management & Announcements**:
   - Admins can promote/demote user roles (`student` ↔ `mentor` ↔ `admin`).
   - Club-wide broadcast system with priority tagging (General, Contest, Workshop, Urgent) and pin functionality.

---

## 5. System Architecture

```
[ Client Browser (React + Vite) ]
          │
          │ HTTPS / REST (Axios with Interceptors)
          ▼
[ Express.js API Gateway ] ── (Helmet, CORS, Rate-Limiting, Zod Validation)
          │
          ├── [ JWT Auth & Refresh Controller ] (Access + Refresh Tokens)
          │
          ├── [ Business Logic Controllers ]
          │      ├── Problem Sheets & Assignments
          │      ├── Leaderboard Aggregations
          │      └── Virtual Practice Rooms
          │
          ├── [ External Services Layer ]
          │      └── Codeforces API Client (Axios + Cache TTL Layer)
          │
          ▼
[ MongoDB Atlas (Mongoose ODM) ]
      ├── Users
      ├── ProblemSheets & SolvedProblems
      ├── Assignments
      ├── PracticeRooms
      └── Announcements
```

---

## 6. Technology Stack

| Layer | Technologies | Justification |
|---|---|---|
| **Frontend** | React 19, Vite, React Router DOM v7 | Ultra-fast client routing, modern reactive component model |
| **Styling** | Vanilla CSS + Tailwind CSS (Glassmorphism design tokens) | High-polish dark developer UI inspired by Linear and Vercel |
| **Data Visualization** | Recharts v3 | Responsive time-series charts with custom rating tooltips & domains |
| **Icons** | Lucide React | Lightweight, consistent iconography |
| **Backend** | Node.js, Express.js | Non-blocking I/O ideal for external API orchestration |
| **Database** | MongoDB Atlas (Mongoose ODM) | Flexible document schema for contest submissions and sheet structures |
| **Security & Auth** | JWT, bcryptjs, Helmet, Express Rate Limit, Zod | Defense-in-depth protection, strict schema validation, brute-force protection |
| **External APIs** | Codeforces REST API | Live verification of competitive programming activity |

---

## 7. Engineering Depth & Technical Decisions

- **Two-Tier JWT Token Refresh Architecture**:
  - Employs short-lived Access Tokens paired with persistent Refresh Tokens and an Axios retry queue to prevent session dropouts on token expiry.
- **External API Rate Limit Protection & Caching**:
  - Codeforces APIs impose rate limits (~5 requests/sec). The backend integrates a configurable in-memory cache TTL (`CODEFORCES_CACHE_TTL`) to prevent hitting 429 errors during concurrent leaderboard queries.
- **Complex Aggregation Pipelines**:
  - Leaderboard metrics aggregate verified solves across time windows (Weekly vs. All-time) and calculate rating differentials.
- **Defensive Error Handling & UX State Management**:
  - Global Axios interceptors catch standard HTTP codes, converting backend error arrays into actionable user toasts.
  - Skeletons and empty-state placeholders ensure UI stability during network delays.

---

## 8. Security & Error Handling

- **Credential Safety**: Passwords hashed with `bcryptjs` (salt rounds: 12).
- **Environment Isolation**: No credentials or private keys committed to source control (strictly audited `.gitignore`).
- **Input Validation**: All incoming request payloads validated against strict `Zod` schemas prior to hitting controllers.
- **Access Control**: Role-based access control (RBAC) middleware guarantees that only mentors/admins can create sheets, broadcast announcements, or edit member roles.
- **Fail-Safe External Requests**: Graceful fallbacks when Codeforces API experiences downtime or maintenance.

---

## 9. Local Setup & Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Free MongoDB Atlas URI or local MongoDB instance

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AryanMoorthy/CP-Club.git
   cd CP-Club
   ```

2. **Install dependencies**:
   ```bash
   # Install root and server dependencies
   npm install
   cd server && npm install && cd ..

   # Install client dependencies
   cd client && npm install && cd ..
   ```

3. **Configure Environment Variables**:
   - Copy `server/.env.example` to `server/.env` and update your MongoDB URI and secrets.
   - Copy `client/.env.example` to `client/.env` (default points to `http://localhost:5000/api`).

4. **Seed Database (Optional but Recommended)**:
   ```bash
   npm run seed
   ```

5. **Start Development Servers**:
   ```bash
   # Terminal 1: Backend Server (runs on http://localhost:5000)
   npm run server

   # Terminal 2: Frontend Client (runs on http://localhost:5173)
   npm run client
   ```

---

## 10. Environment Variables

### Server (`server/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/cpclub` |
| `JWT_ACCESS_SECRET` | Secret key for access token signing | `64_char_random_hex` |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | `64_char_random_hex` |
| `CLIENT_URL` | Allowed CORS origin for frontend | `http://localhost:5173` |
| `CODEFORCES_CACHE_TTL` | Cache duration for CF API responses (ms) | `300000` (5 mins) |

### Client (`client/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Base endpoint for backend API | `http://localhost:5000/api` |

---

## 11. Demo Credentials

The database seed provides predefined accounts across all three platform roles:

| Role | Email | Password | Codeforces Handle |
|---|---|---|---|
| **Admin** | `admin@cpclub.org` | `AdminPassword123!` | `@tourist` |
| **Mentor** | `mentor@cpclub.org` | `MentorPassword123!` | `@Petr` |
| **Student** | `student@cpclub.org` | `StudentPassword123!` | `@Benq` |

*(Evaluators can also register a brand new account with their own Codeforces handle at `/register`)*

---

## 12. Deployment Links & Access

- **GitHub Repository**: [https://github.com/AryanMoorthy/CP-Club](https://github.com/AryanMoorthy/CP-Club)
- **Live Deployed Application**: *(Provide your production URL, e.g. Vercel/Render URL)*
- **API Status / Health Check**: *(e.g., `https://<backend-url>/api/health`)*

---

## 13. Demo Video

- **Video Walkthrough Link**: *(Provide your 3–5 min Loom / YouTube unlisted video link)*
- **Demo Highlights**:
  1. Overview of collegiate CP club challenge & platform mission.
  2. Student flow: Profile sync with Codeforces, rating graph interactivity, and practice sheet verification.
  3. Mentor flow: Creating problem sheets and assigning them with deadlines.
  4. Leaderboard & Practice Room real-time interactions.
  5. Admin member role management.
