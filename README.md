# Nanny Hours Tracker

A simple web app to track nanny hours and calculate weekly pay.

## Prerequisites

- Node.js (v18 or later)
- npm

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Initialize the database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Calendar View:** Drag and drop to add shifts.
- **Weekly Calculation:** Automatically calculates total hours and pay based on the hourly rate.
- **Historic Data:** Navigate to previous weeks to see past records.
- **Adjustable Rate:** Change the hourly rate on the fly.
