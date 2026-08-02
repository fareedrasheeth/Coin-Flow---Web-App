const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'CoinFlow — Smart Coin Sorting & Dispensing System',
    backgroundColor: '#030712', // Dark background theme
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows WebSocket & local REST API connection to ESP32
    },
  });

  // Remove default menu bar for clean app UI
  Menu.setApplicationMenu(null);

  if (isDev) {
    // Development Mode: Load local Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open Chrome DevTools in development
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production Mode: Serve built static files or export folder
    const outDir = path.join(__dirname, 'out');
    if (fs.existsSync(outDir)) {
      // Create lightweight local server for static export files
      const server = http.createServer((req, res) => {
        let filePath = path.join(outDir, req.url === '/' ? 'index.html' : req.url);
        if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
          filePath += '.html';
        }
        if (!fs.existsSync(filePath)) {
          filePath = path.join(outDir, '404.html');
        }

        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        fs.readFile(filePath, (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
          }
        });
      });

      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        mainWindow.loadURL(`http://127.0.0.1:${port}`);
      });
    } else {
      // Fallback to dev server URL
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  // Gracefully show window when ready to prevent flicker
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in user's default web browser instead of Electron app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Commands from Renderer
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:quit', () => app.quit());
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());

// App Lifecycle Events
app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
