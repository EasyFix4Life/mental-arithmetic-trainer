'use strict';

const { app, BrowserWindow, dialog, Menu, net, protocol, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  APP_URL,
  CONTENT_SECURITY_POLICY,
  isAllowedAppUrl,
  resolveAssetPath,
} = require('./security.cjs');

const WINDOW_TITLE = 'Mental Arithmetic';
let mainWindow = null;
let fatalErrorShown = false;

// Standard URL resolution lets the unchanged Vite build load its relative ES
// modules. The scheme remains subject to CSP and normal web security.
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);

function failToOpen(error) {
  if (fatalErrorShown) return;
  fatalErrorShown = true;
  console.error('Unable to open Mental Arithmetic:', error);
  dialog.showErrorBox(
    'Mental Arithmetic could not open',
    'The bundled application could not be loaded. Try extracting the complete app again. '
      + 'If running the source project, run npm run build before npm run desktop.\n\n'
      + String(error?.message ?? error),
  );
  app.quit();
}

function installMenu() {
  const template = [];
  if (process.platform === 'darwin') {
    template.push({
      label: WINDOW_TITLE,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }
  template.push(
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  );
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function installOfflineSession() {
  const appSession = session.defaultSession;
  appSession.setPermissionCheckHandler(() => false);
  appSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  appSession.on('will-download', (event) => event.preventDefault());
  // Local content has no network requirement. CSP separately denies renderer
  // connections; this also cancels requests attempted outside normal page APIs.
  appSession.webRequest.onBeforeRequest({
    urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'],
  }, (_details, callback) => callback({ cancel: true }));
}

function installBundledProtocol() {
  // Resolve from this entry point, which lives in desktop/ both in source and
  // app.asar. Direct main-file launches otherwise report desktop/ as appPath.
  const distRoot = path.resolve(__dirname, '..', 'dist');
  const realDistRoot = fs.realpathSync(distRoot);
  if (!fs.statSync(path.join(realDistRoot, 'index.html')).isFile()) {
    throw new Error('The dist/index.html build is missing.');
  }
  protocol.handle('app', async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }
    const assetPath = resolveAssetPath(distRoot, request.url);
    if (!assetPath) return new Response('Not found', { status: 404 });
    try {
      const realAssetPath = fs.realpathSync(assetPath);
      const relative = path.relative(realDistRoot, realAssetPath);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)
        || !fs.statSync(realAssetPath).isFile()) {
        return new Response('Not found', { status: 404 });
      }
      const fileResponse = await net.fetch(pathToFileURL(realAssetPath).toString());
      const headers = new Headers(fileResponse.headers);
      headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Cache-Control', 'no-store');
      return new Response(request.method === 'HEAD' ? null : fileResponse.body, {
        status: fileResponse.status,
        headers,
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

function createWindow() {
  const window = new BrowserWindow({
    title: WINDOW_TITLE,
    width: 1100,
    height: 800,
    minWidth: 320,
    minHeight: 480,
    backgroundColor: '#e8d7b5',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
      navigateOnDragDrop: false,
    },
  });
  mainWindow = window;
  window.once('ready-to-show', () => window.show());
  window.on('page-title-updated', (event) => event.preventDefault());
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedAppUrl(url)) event.preventDefault();
  });
  window.webContents.on('will-redirect', (event, url) => {
    if (!isAllowedAppUrl(url)) event.preventDefault();
  });
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.webContents.on('did-fail-load', (_event, code, description, _url, isMainFrame) => {
    if (isMainFrame && code !== -3) failToOpen(new Error(description));
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit') failToOpen(new Error(`The application renderer stopped (${details.reason}).`));
  });
  window.loadURL(APP_URL).catch(failToOpen);
}

app.whenReady().then(() => {
  installBundledProtocol();
  installOfflineSession();
  installMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch(failToOpen);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
