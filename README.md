# CBT MVP - De-Benign School

Computer-based test system. Built single-school first (schoolId already on
every model so multi-tenant is a filter change later, not a rewrite).

## Structure
- backend/  Node + TypeScript + Express + MongoDB (Mongoose)
- frontend/ React + TypeScript + Vite

## Build order (matches MVP scope)
1. Week 1-2: auth, school/class/subject setup, MCQ question bank CRUD
2. Week 3-4: exam builder, student test-taking UI, 15s autosave
3. Week 5: auto-grade MCQ, results view
4. Phase 2 (later): offline/sync, tab-switching/lockdown detection,
   theory questions + manual grading, multi-tenant

## Setup
### Backend
cd backend && npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev

Once MongoDB is connected, seed demo accounts (one-time, safe to re-run):
cd backend && npm run seed

This creates a demo school, one class (JSS2A), one subject (Basic Science),
and three login accounts:

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@debenign.test      | Admin@123    |
| Teacher | teacher@debenign.test    | Teacher@123  |
| Student | student@debenign.test    | Student@123  |

These are also shown on the app's home page. Change or remove them before
using this anywhere but local development.

### Frontend
cd frontend && npm install
npm run dev
