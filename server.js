const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const { Groq } = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: 'REMOVED_GROQ_API_KEY'
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
const db = new sqlite3.Database('./interntrack.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // Create applications table if it doesn't exist
    // Create applications table
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

    // Create status_events table
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

    // Enable foreign key support
    db.run('PRAGMA foreign_keys = ON');
  }
});

// API Routes

// Get all applications
app.get('/api/applications', (req, res) => {
  db.all('SELECT * FROM applications', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add new application
app.post('/api/applications', (req, res) => {
  const application = req.body;
  application.id = Date.now().toString();
  application.lastUpdated = new Date().toISOString();
  console.log('Received application data:', application);
  
  // Set hadInterview flag if initial status is Interview or Offered
  const hadInterview = (application.status === 'Interview' || application.status === 'Offered') ? 1 : 0;
  
  const sql = `
    INSERT INTO applications (
      id, company, role, dateApplied, location, 
      applicationLink, status, hadInterview, notes, lastUpdated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(
    sql, 
    [
      application.id, 
      application.company, 
      application.role, 
      application.dateApplied, 
      application.location || '',
      application.applicationLink || '',
      application.status,
      hadInterview,
      application.notes || '',
      application.lastUpdated
    ],
    function(err) {
      if (err) {
        console.error('Error adding application to DB:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        ...application,
        id: application.id
      });
    }
  );
});

// Update application
app.put('/api/applications/:id', (req, res) => {
  const id = req.params.id;
  const application = req.body;
  application.lastUpdated = new Date().toISOString();

  // Start a transaction for data consistency
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT * FROM applications WHERE id = ?', [id], (err, existingApp) => {
      if (err) {
        console.error('Error fetching application:', err);
        db.run('ROLLBACK');
        res.status(500).json({ error: 'Database error while fetching application' });
        return;
      }

      if (!existingApp) {
        db.run('ROLLBACK');
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      try {
        // Determine hadInterview value
        const hadInterview = (application.status === 'Interview' || application.status === 'Offered' || existingApp.hadInterview === 1) ? 1 : 0;

        // Record status change if status is different
        if (existingApp.status !== application.status) {
          const timestamp = new Date().toISOString();
          db.run(
            'INSERT INTO status_events (application_id, old_status, new_status, timestamp) VALUES (?, ?, ?, ?)',
            [id, existingApp.status, application.status, timestamp],
            (err) => {
              if (err) {
                console.error('Error recording status event:', err);
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Database error while recording status change' });
                return;
              }
            }
          );
        }

        const sql = `
          UPDATE applications SET
            company = ?,
            role = ?,
            dateApplied = ?,
            location = ?,
            applicationLink = ?,
            status = ?,
            hadInterview = ?,
            notes = ?,
            lastUpdated = ?
          WHERE id = ?
        `;

        db.run(
          sql,
          [
            application.company,
            application.role,
            application.dateApplied,
            application.location || '',
            application.applicationLink || '',
            application.status,
            hadInterview,
            application.notes || '',
            application.lastUpdated,
            id
          ],
          function(err) {
            if (err) {
              console.error('Error updating application:', err);
              db.run('ROLLBACK');
              res.status(500).json({ error: 'Database error while updating application' });
              return;
            }

            if (this.changes === 0) {
              db.run('ROLLBACK');
              res.status(404).json({ error: 'Application not found' });
              return;
            }

            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Database error while committing changes' });
                return;
              }

              res.json({ ...application, id, hadInterview });
            });
          }
        );
      } catch (err) {
        console.error('Unexpected error:', err);
        db.run('ROLLBACK');
        res.status(500).json({ error: 'Unexpected error occurred' });
      }
    });
  });
});

// Delete application
app.delete('/api/applications/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM applications WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    res.json({ message: 'Application deleted successfully' });
  });
});

// Clear all applications
app.delete('/api/applications', (req, res) => {
  db.run('DELETE FROM applications', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ message: 'All applications deleted successfully' });
  });
});

// Get status events for an application
app.get('/api/applications/:id/status-events', (req, res) => {
  const id = req.params.id;
  
  db.all(
    `SELECT * FROM status_events
     WHERE application_id = ?
     ORDER BY timestamp DESC`,
    [id],
    (err, events) => {
      if (err) {
        console.error('Error fetching status events:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json(events);
    }
  );
});

// Parse job posting with Groq API
app.post('/api/parse-job-posting', async (req, res) => {
  try {
    const { jobPostingText } = req.body;
    
    if (!jobPostingText || !jobPostingText.trim()) {
      return res.status(400).json({ error: 'Job posting text is required' });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a job posting parser. Extract and return ONLY a JSON object with no markdown formatting, code blocks, or additional text. Use this exact format:\n{\n  "company": "Company Name",\n  "role": "Job Title",\n  "location": "City, State/Province",\n  "description": "Brief job description"\n}\n\nEnsure all values are properly escaped JSON strings.'
        },
        {
          role: 'user',
          content: jobPostingText
        }
      ],
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      temperature: 0.1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });

    let parsedResult = chatCompletion.choices[0]?.message?.content?.trim();
    
    if (!parsedResult) {
      throw new Error('No response from Groq API');
    }

    // Remove markdown code blocks if present
    if (parsedResult.startsWith('```') && parsedResult.endsWith('```')) {
      parsedResult = parsedResult.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }

    // Parse and validate JSON response
    const jsonResult = JSON.parse(parsedResult);
    
    // Validate required fields
    if (!jsonResult.company || !jsonResult.role) {
      throw new Error('Invalid response: missing required fields');
    }

    res.json(jsonResult);
  } catch (error) {
    console.error('Error parsing job posting:', error);
    res.status(500).json({ 
      error: 'Failed to parse job posting', 
      details: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
