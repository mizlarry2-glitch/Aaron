# Setting up the Cold Email Command Center

This guide covers how to set up and start using the Cold Email Command Center on your local machine.

## Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** running locally or a remote Postgres URL
- **Chrome** (or a Chromium-based browser)

## 1. Database Setup
1. Create a Postgres database for the project (e.g., `coldemail`).
2. Run the SQL statements found in `backend/schema.sql` against your new database to create all required tables, constraints, and indexes.

## 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory with your database connection string and a JWT secret for authentication:
   ```env
   DATABASE_URL=postgres://your_username:your_password@localhost:5432/coldemail
   JWT_SECRET=your_super_secret_jwt_key
   PORT=3000

   # Optional: Configure the pacing limits (in seconds)
   MIN_DELAY=30
   MAX_DELAY=180
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   *(The server will run on port 3000 by default).*

## 3. Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(The dashboard will typically be available at `http://localhost:5173/`).*

## 4. Chrome Extension Setup
The Chrome extension acts as a quick launcher for your dashboard.

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **"Developer mode"** in the top right corner.
3. Click **"Load unpacked"**.
4. Select the `extension/` folder in this repository.
5. The extension icon will appear in your browser toolbar. Clicking it will automatically open the dashboard (`http://localhost:5173/` by default).

## Next Steps
Once the app is running:
1. Open the dashboard.
2. Go to **Settings** to add your AI Provider API keys.
3. Go to **SMTP Accounts** to connect your first sender account (make sure to set its Daily Send Limit!).
4. Import your prospects and build your first sequence!