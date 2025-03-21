const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for the client app
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Connect to SQLite database
const db = new sqlite3.Database('./interntrack.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // Create applications table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        dateApplied TEXT NOT NULL,
        location TEXT,
        applicationLink TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        lastUpdated TEXT NOT NULL
      )
    `);
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
  
  const sql = `
    INSERT INTO applications (
      id, company, role, dateApplied, location, 
      applicationLink, status, notes, lastUpdated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      application.notes || '',
      application.lastUpdated
    ],
    function(err) {
      if (err) {
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
  
  const sql = `
    UPDATE applications SET
      company = ?,
      role = ?,
      dateApplied = ?,
      location = ?,
      applicationLink = ?,
      status = ?,
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
      application.notes || '',
      application.lastUpdated,
      id
    ],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      
      res.json({ ...application, id });
    }
  );
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
