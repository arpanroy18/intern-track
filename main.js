const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;

// Database path in user data directory to ensure it's writable in packaged app
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'interntrack.db');

// Setup database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    dialog.showErrorBox('Database Error', 'Could not connect to the database: ' + err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    
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

// Setup Express server
function setupServer() {
  const server = express();
  const PORT = 43210; // Use a less common port to avoid conflicts
  
  server.use(cors());
  server.use(express.json());
  
  // Serve static files from the root directory
  server.use(express.static(__dirname));
  
  // API Routes
  
  // Get all applications
  server.get('/api/applications', (req, res) => {
    db.all('SELECT * FROM applications', [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  });
  
  // Add new application
  server.post('/api/applications', (req, res) => {
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
  server.put('/api/applications/:id', (req, res) => {
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
  server.delete('/api/applications/:id', (req, res) => {
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
  server.delete('/api/applications', (req, res) => {
    db.run('DELETE FROM applications', function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ message: 'All applications deleted successfully' });
    });
  });
  
  // Start the server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  return `http://localhost:${PORT}`;
}

// Create the main application window
function createWindow() {
  // Start the server and get the URL
  const serverUrl = setupServer();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });
  
  // Load the app
  mainWindow.loadURL(serverUrl);
  
  // Create application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Data',
          click: exportData
        },
        {
          label: 'Import Data',
          click: importData
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => app.quit(),
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About InternTrack',
          click: showAbout
        }
      ]
    }
  ]);
  
  Menu.setApplicationMenu(menu);
  
  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Export data function
function exportData() {
  if (!mainWindow) return;
  
  dialog.showSaveDialog(mainWindow, {
    title: 'Export Application Data',
    defaultPath: path.join(app.getPath('documents'), 'interntrack-data.json'),
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  }).then(result => {
    if (result.canceled) return;
    
    // Get all applications from database and save to file
    db.all('SELECT * FROM applications', [], (err, rows) => {
      if (err) {
        dialog.showErrorBox('Export Error', 'Failed to export data: ' + err.message);
        return;
      }
      
      const fs = require('fs');
      fs.writeFile(result.filePath, JSON.stringify(rows, null, 2), err => {
        if (err) {
          dialog.showErrorBox('Export Error', 'Failed to write file: ' + err.message);
        } else {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Export Successful',
            message: 'Your application data has been exported successfully.'
          });
        }
      });
    });
  }).catch(err => {
    dialog.showErrorBox('Export Error', err.message);
  });
}

// Import data function
function importData() {
  if (!mainWindow) return;
  
  dialog.showOpenDialog(mainWindow, {
    title: 'Import Application Data',
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (result.canceled) return;
    
    const fs = require('fs');
    fs.readFile(result.filePaths[0], 'utf8', (err, data) => {
      if (err) {
        dialog.showErrorBox('Import Error', 'Failed to read file: ' + err.message);
        return;
      }
      
      try {
        const applications = JSON.parse(data);
        
        // Confirm import will overwrite existing data
        dialog.showMessageBox(mainWindow, {
          type: 'question',
          buttons: ['Cancel', 'Import'],
          defaultId: 1,
          title: 'Confirm Import',
          message: 'Importing will replace your current data. Continue?'
        }).then(response => {
          if (response.response === 0) return; // User canceled
          
          // Clear existing data and import new data
          const transaction = db.serialize(() => {
            // Begin transaction
            db.run('BEGIN TRANSACTION');
            
            // Clear all existing records
            db.run('DELETE FROM applications', err => {
              if (err) {
                db.run('ROLLBACK');
                dialog.showErrorBox('Import Error', 'Failed to clear existing data: ' + err.message);
                return;
              }
              
              // Insert imported records
              const stmt = db.prepare(`
                INSERT INTO applications (
                  id, company, role, dateApplied, location, 
                  applicationLink, status, notes, lastUpdated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);
              
              let importError = false;
              
              applications.forEach(app => {
                stmt.run(
                  app.id, 
                  app.company, 
                  app.role, 
                  app.dateApplied, 
                  app.location || '',
                  app.applicationLink || '',
                  app.status,
                  app.notes || '',
                  app.lastUpdated || new Date().toISOString(),
                  err => {
                    if (err) {
                      importError = true;
                      console.error('Import error for record:', app, err);
                    }
                  }
                );
              });
              
              stmt.finalize(err => {
                if (err || importError) {
                  db.run('ROLLBACK');
                  dialog.showErrorBox('Import Error', 'Failed to import some records');
                  return;
                }
                
                // Commit transaction
                db.run('COMMIT', err => {
                  if (err) {
                    dialog.showErrorBox('Import Error', 'Failed to commit transaction: ' + err.message);
                    return;
                  }
                  
                  dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Import Successful',
                    message: `Successfully imported ${applications.length} applications.`
                  });
                  
                  // Reload the page to show imported data
                  mainWindow.reload();
                });
              });
            });
          });
        });
        
      } catch (parseErr) {
        dialog.showErrorBox('Import Error', 'Invalid JSON file: ' + parseErr.message);
      }
    });
  }).catch(err => {
    dialog.showErrorBox('Import Error', err.message);
  });
}

// Show about dialog
function showAbout() {
  dialog.showMessageBox(mainWindow, {
    title: 'About InternTrack',
    message: 'InternTrack',
    detail: 'Version 1.0.0\n\nA desktop application for tracking internship applications.\n\nBuilt with Electron, Express, and SQLite.',
    icon: path.join(__dirname, 'assets/icon.png')
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create a window when dock icon is clicked and no windows are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app will quit - close database connection
app.on('will-quit', () => {
  db.close(err => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
});
