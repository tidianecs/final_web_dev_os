# 🚀 Deployment Plan: Render + TiDB Cloud

This document outlines the steps to migrate the JOJ Quiz Backend from Railway to Render (App Hosting) and TiDB Cloud (MySQL Database).

## 1. Database Setup (TiDB Cloud)
TiDB Cloud provides a serverless MySQL-compatible database with a generous free tier.

1.  **Sign Up**: Go to [tidbcloud.com](https://tidbcloud.com) and create an account.
2.  **Create Cluster**: Choose **TiDB Serverless**. Pick a region closest to your users (e.g., AWS / N. Virginia).
3.  **Get Connection String**:
    *   Click **Connect**.
    *   Choose **Connect with standard connection string**.
    *   Copy the **URL** (it looks like `mysql://user:pass@host:4000/test?ssl-mode=VERIFY_IDENTITY`).
    *   **Note**: Ensure the database name in the URL matches what you want (e.g., `joj_quiz`).

## 2. Hosting Setup (Render)
Render will host the Node.js application and handle WebSockets.

1.  **Sign Up**: Go to [render.com](https://render.com) and connect your GitHub account.
2.  **New Web Service**:
    *   Select the `final_web_dev_os` repository (backend folder).
    *   **Environment**: `Node`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `npm start`.
    *   **Instance Type**: `Free`.
3.  **Environment Variables**:
    *   Add the following in the Render dashboard under **Environment**:
    | Variable | Value |
    | :--- | :--- |
    | `DATABASE_URL` | *Your TiDB connection string* |
    | `JWT_SECRET` | *Your secure 64-byte hex string* |

## 3. Database Seeding
Since we are on a new database, we need to create the tables and add the questions.

1.  **Auto-Sync**: The backend is configured to run `sequelize.sync()` on startup. Simply deploying to Render will create the tables.
2.  **Run Seed Locally**:
    *   Temporarily update your local `.env` with the `DATABASE_URL` from TiDB (replace the old DB_HOST/etc variables).
    *   Run: `node seed.js`.

## 4. Frontend Update
1.  **Update Vercel**: Change `VITE_API_URL` and `VITE_SOCKET_URL` in your Vercel project to point to your new Render URL (e.g., `https://joj-quiz-backend.onrender.com`).
2.  **CORS**: Ensure the Render URL is added to the `allowedOrigins` in `index.js`.

## ✅ Migration Checklist
- [ ] Create TiDB Cluster
- [ ] Get TiDB Connection URL
- [ ] Create Render Web Service
- [ ] Input Environment Variables in Render
- [ ] Confirm Backend logs show `✅ Database synced`
- [ ] Run `node seed.js` (pointing to TiDB)
- [ ] Update Vercel environment variables
- [ ] Test Login/Register on the live site
