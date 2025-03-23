# InternTrack Desktop App

A cross-platform desktop application for tracking internship applications.

## Development Setup

1. Make sure you have Node.js installed (https://nodejs.org/)

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application in development mode:
   ```
   npm start
   ```

## Building the Application

To build the application for your current platform:
```
npm run package
```

To build for specific platforms:
```
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux
```

The packaged applications will be available in the `dist` directory.

## Features

- Track internship applications in a persistent SQLite database
- Filter applications by status
- Search applications by company, role, or notes
- View statistics about your application process
- Parse job postings automatically
- Export and import application data
- Native desktop application that works offline

## Data Storage

All application data is stored in a SQLite database file located in your application data directory:

- Windows: `%APPDATA%\interntrack\interntrack.db`
- macOS: `~/Library/Application Support/interntrack/interntrack.db`
- Linux: `~/.config/interntrack/interntrack.db`

You can back up this file to preserve your data or use the Export/Import feature in the application.

## Technologies Used

- Electron - Cross-platform desktop app framework
- Node.js & Express - Backend server
- SQLite - File-based database
- HTML, CSS, JavaScript - Frontend
