const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Setup API server
const expressApp = express();
const PORT = 43210;

// Determine DB path - store in user data directory
const DB_PATH = path.join(app.getPath('userData'), 'interntrack.db');
console.log('Database location:', DB_PATH);

// Connect to SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database at', DB_PATH);
    
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

// API setup
expressApp.use(cors());
expressApp.use(express.json());

// GET all applications
expressApp.get('/api/applications', (req, res) => {
  db.all('SELECT * FROM applications', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST new application
expressApp.post('/api/applications', (req, res) => {
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
      
      res.status(201).json({
        ...application,
        id: application.id
      });
    }
  );
});

// PUT update application
expressApp.put('/api/applications/:id', (req, res) => {
  const id = req.params.id;
  const application = req.body;
  application.lastUpdated = new Date().toISOString();
  
  // First, get the existing application
  db.get('SELECT * FROM applications WHERE id = ?', [id], (err, existingApp) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!existingApp) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    
    // Merge existing data with updates, preserving fields that weren't sent
    const updatedApp = {
      ...existingApp,
      ...application,
      lastUpdated: application.lastUpdated
    };
    
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
        updatedApp.company,
        updatedApp.role,
        updatedApp.dateApplied,
        updatedApp.location || '',
        updatedApp.applicationLink || '',
        updatedApp.status,
        updatedApp.notes || '',
        updatedApp.lastUpdated,
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
        
        res.json(updatedApp);
      }
    );
  });
});

// DELETE application
expressApp.delete('/api/applications/:id', (req, res) => {
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
    
    res.status(204).send();
  });
});

// DELETE all applications
expressApp.delete('/api/applications', (req, res) => {
  db.run('DELETE FROM applications', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.status(204).send();
  });
});

// Start Express server
expressApp.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Electron app code
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Uncomment to open DevTools on startup
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Create application menu with clipboard support
  const template = [
    {
      label: 'Application',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Properly close the database when the app is quitting
app.on('will-quit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
});
