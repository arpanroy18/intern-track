# InternTrack - Job Application Tracker

A modern, AI-powered job application tracking system built with React, TypeScript, and Tailwind CSS.

![InternTrack Preview](public/InternTrack%20Preview.png)

## Features

- ✨ Beautiful dark mode UI with glassmorphism effects
- 📊 Real-time statistics dashboard
- 📝 Manual job application entry (AI integration ready)
- 🗓️ Application timeline tracking
- 🏷️ Status management (Applied, Interviewing, Offered, Rejected)
- 🔍 Detailed job information views
- 📱 Fully responsive design

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast development and build tool
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

1. **Add Applications**: Click the "Add Application" button and fill in job details manually
2. **Track Status**: Update application status using the dropdown in each job card
3. **View Timeline**: Click the clock icon to see the application timeline
4. **View Details**: Click on any job card to see detailed information

## Project Structure

```
src/
├── app.tsx         # Main application component
├── types.ts        # TypeScript type definitions
├── main.tsx        # React application entry point
└── index.css       # Tailwind CSS imports
```

## Styling

The application uses a dark theme with:
- Slate background colors (950, 900, 800)
- Purple and pink gradients for accents
- Glassmorphism effects with backdrop blur
- Smooth animations and transitions

## Future Enhancements

- AI-powered job description parsing
- Data persistence (localStorage/database)
- Export functionality
- Advanced filtering and search
- Calendar integration
- Notification system

## License

This project is open source and available under the MIT License. 