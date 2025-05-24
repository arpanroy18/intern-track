# InternTrack - Internship Application Tracker

InternTrack is a web application for tracking internship applications. It helps students and job seekers manage their internship application process by keeping track of applications, interviews, and offers.

## Features

- Track internship applications with company, role, date applied, and status
- Categorize applications as Applied, Interview, Offered, or Closed
- Parse job postings to automatically extract company, role, and location information
- Filter and search applications
- Track interview rate statistics

## Project Structure

The project has been refactored to follow a modular structure:

```
InternTrack/
├── index.html              # Main HTML file
├── public/                 # Public assets
│   ├── css/
│   │   └── styles.css      # Extracted styles
│   └── js/
│       ├── api.js          # API and data functions
│       ├── job-parser.js   # Job posting parser
│       ├── main.js         # Application entry point and event handling
│       ├── ui.js           # UI functions
│       └── utils.js        # Utility functions
├── server.js               # Backend server with API endpoints
├── interntrack.db          # SQLite database
└── package.json            # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/InternTrack.git
   cd InternTrack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

- `GET /api/applications` - Retrieve all applications
- `POST /api/applications` - Add a new application
- `PUT /api/applications/:id` - Update an application
- `DELETE /api/applications/:id` - Delete an application
- `DELETE /api/applications` - Clear all applications

## Technologies Used

- Frontend: HTML, CSS, JavaScript (ES6+)
- Backend: Node.js, Express
- Database: SQLite
- AI Integration: Groq API for job posting parsing

## License

MIT
