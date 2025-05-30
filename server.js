// require('dotenv').config(); // Vercel handles env vars; primarily for local dev
const express = require('express');
// const sqlite3 = require('sqlite3').verbose(); // Keep require, but DB instantiation will be commented
const path = require('path');
const cors = require('cors');
const { Groq } = require('groq-sdk'); // Restore Groq import

// Initialize Groq client
const groq = new Groq({ // Restore Groq client
  apiKey: process.env.GROQ_API_KEY
});

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for the client app
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// Serve static files - serve both root and public directory
app.use(express.static(path.join(__dirname)));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Connect to SQLite database
/* // Temporarily commenting out SQLite connection and all DB-related routes
const db = new sqlite3.Database('./interntrack.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    db.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        dateApplied TEXT NOT NULL,
        location TEXT,
        applicationLink TEXT,
        status TEXT NOT NULL,
        hadInterview INTEGER DEFAULT 0,
        notes TEXT,
        lastUpdated TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS status_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id TEXT NOT NULL,
        old_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);

    db.run('PRAGMA foreign_keys = ON');
  }
});
*/

// API Routes

/* // Temporarily commenting out all DB-related API routes
app.get('/api/applications', (req, res) => {
  // ... code ...
});

app.post('/api/applications', (req, res) => {
  // ... code ...
});

app.put('/api/applications/:id', (req, res) => {
  // ... code ...
});

app.delete('/api/applications/:id', (req, res) => {
  // ... code ...
});

app.delete('/api/applications', (req, res) => {
  // ... code ...
});

app.get('/api/applications/:id/status-events', (req, res) => {
  // ... code ...
});
*/

/* // Temporarily commenting out Groq API route
app.post('/api/parse-job-posting', async (req, res) => {
  // ... code ...
});
*/

// Parse job posting endpoint using Groq API
app.post('/api/parse-job-posting', async (req, res) => {
  try {
    const { jobPostingText } = req.body;
    
    if (!jobPostingText || !jobPostingText.trim()) {
      return res.status(400).json({ error: 'Job posting text is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'Groq API key not configured',
        details: 'Please set GROQ_API_KEY environment variable'
      });
    }

    const prompt = `
Please extract the following information from this job posting and return it as a JSON object:
- company: The company name
- role: The job title/role
- location: The location (city, state, country, or "Remote")
- description: A brief summary of the role (2-3 sentences max)

Job Posting:
${jobPostingText}

Return only valid JSON in this format:
{
  "company": "Company Name",
  "role": "Job Title",
  "location": "Location",
  "description": "Brief description"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      throw new Error('No response from Groq API');
    }

    // Try to parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Validate required fields
    if (!parsedData.company || !parsedData.role) {
      throw new Error('AI could not extract required information (company and role)');
    }

    res.json(parsedData);

  } catch (error) {
    console.error('Error parsing job posting:', error);
    
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'API configuration error',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to parse job posting',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    // Check for Groq key presence directly from env var, even if Groq client is not initialized
    hasGroqKey: !!process.env.GROQ_API_KEY, 
    hasFirebaseVars: {
      apiKey: !!process.env.FIREBASE_API_KEY,
      authDomain: !!process.env.FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.FIREBASE_APP_ID,
      measurementId: !!process.env.FIREBASE_MEASUREMENT_ID
    }
  });
});

// Get Firebase configuration
app.get('/api/firebase-config', (req, res) => {
  console.log('--- /api/firebase-config endpoint Vercel START ---'); // Distinct log
  console.log('Environment variables check (in /api/firebase-config):');
  console.log('FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'SET' : 'NOT SET');
  console.log('FIREBASE_AUTH_DOMAIN:', process.env.FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
  console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET');
  console.log('FIREBASE_MESSAGING_SENDER_ID:', process.env.FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET');
  console.log('FIREBASE_APP_ID:', process.env.FIREBASE_APP_ID ? 'SET' : 'NOT SET');
  console.log('FIREBASE_MEASUREMENT_ID:', process.env.FIREBASE_MEASUREMENT_ID ? 'SET' : 'NOT SET');
  console.log('GROQ_API_KEY (for reference):', process.env.GROQ_API_KEY ? 'SET' : 'NOT SET');


  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  };
  
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase environment variables (in /api/firebase-config):', missingFields);
    console.error('Firebase config object being evaluated (in /api/firebase-config):', firebaseConfig);
    console.log('--- /api/firebase-config endpoint Vercel END with ERROR ---');
    return res.status(500).json({ 
      error: 'Firebase configuration incomplete on server', 
      missingFields,
      debug: 'Check server logs (Vercel > Functions > server.js) for environment variable status.'
    });
  }
  
  console.log('Firebase configuration loaded successfully (from /api/firebase-config)');
  console.log('--- /api/firebase-config endpoint Vercel END with SUCCESS ---');
  res.json(firebaseConfig);
});

// Catch-all handler: send back index.html for any non-API routes
app.get('*', (req, res) => {
  // Check if the request is for an API route that wasn't matched
  if (req.path.startsWith('/api/')) {
    console.warn(`Unmatched API route: ${req.path} - returning 404`);
    return res.status(404).json({ error: `API endpoint ${req.path} not found.` });
  }
  console.log(`Serving index.html for non-API route: ${req.path}`);
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server (primarily for local development, Vercel handles this differently)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

// Export the Express app for Vercel
module.exports = app;
