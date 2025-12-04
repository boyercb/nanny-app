# Deployment Instructions

## 1. Prerequisites
- A GitHub account
- A Vercel account (can sign up with GitHub)

## 2. Push to GitHub
1. Initialize git if not already done:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a new repository on GitHub.
3. Follow the instructions to push your existing code to the new repository.

## 3. Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. **Database Setup**:
   - Before clicking Deploy, go to the **Storage** tab (or create the project first and then add storage).
   - Actually, it's easier to:
     1. Deploy the project (it might fail first run due to missing env vars, that's okay).
     2. Go to the Project Dashboard > **Storage**.
     3. Click **Connect Store** > **Postgres** > **Create New**.
     4. Accept the terms and create.
     5. This will automatically add `POSTGRES_PRISMA_URL` and other vars to your project.

5. **Environment Variables**:
   - Go to **Settings** > **Environment Variables**.
   - Add the following:
     - `NEXTAUTH_SECRET`: Generate one (run `openssl rand -base64 32` in terminal or use a random string).
     - `NEXTAUTH_URL`: Your Vercel URL (e.g., `https://nanny-app.vercel.app`). Vercel usually sets this automatically but good to be sure.
     - `MY_EMAIL`: Your email address (User 1).
     - `MY_PASSWORD`: The **HASHED** version of your password (User 1).
     - `WIFE_EMAIL`: Your wife's email address (User 2).
     - `WIFE_PASSWORD`: The **HASHED** version of your wife's password (User 2).

   > **How to generate a password hash:**
   > 1. Run `node scripts/generate-hash.js` in your local terminal.
   > 2. Enter your desired password.
   > 3. Copy the output string (it will look like `$2a$10$....`).
   > 4. Paste that string as the value for `MY_PASSWORD` or `WIFE_PASSWORD`.

6. **Redeploy**:
   - Go to **Deployments** and redeploy the latest commit to pick up the new variables.

## 4. Database Migration
Once the database is connected and env vars are set:
1. Vercel usually runs `postinstall` which runs `prisma generate`.
2. You need to push the schema to the DB. You can do this locally if you connect to the Vercel DB, or add a build command.
   - **Recommended**: Connect locally to Vercel DB.
     1. Install Vercel CLI: `npm i -g vercel`
     2. Login: `vercel login`
     3. Link project: `vercel link`
     4. Pull env vars: `vercel env pull .env`
     5. Run migration: `npx prisma db push`

## 5. Local Development
To run locally with the production database (or a separate dev branch database):
1. `vercel env pull .env` (to get the DB credentials)
2. Add your local user/pass credentials to `.env` if they aren't pulled (Vercel might not pull sensitive vars if not configured to).
3. `npm run dev`
