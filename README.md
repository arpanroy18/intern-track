# InternTrack

A web application for tracking internship applications with a file-based SQLite database.

## Setup Instructions

1. Make sure you have Node.js installed (https://nodejs.org/)

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Features

- Track internship applications in a persistent SQLite database
- Filter applications by status
- Search applications by company, role, or notes
- View statistics about your application process
- Parse job postings automatically

## Database Information

All application data is stored in a SQLite database file (`interntrack.db`) which is created automatically when you first run the application. This ensures your data persists between sessions and system restarts.

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: SQLite
