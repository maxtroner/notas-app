const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWindow;

function sendUpdaterStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updater:status", payload);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: "Notas",
    backgroundColor: "#f6f4ee",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    sendUpdaterStatus({ state: "checking", message: "Buscando actualizaciones..." });
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdaterStatus({ state: "available", message: `Descargando version ${info.version}...` });
  });

  autoUpdater.on("update-not-available", () => {
    sendUpdaterStatus({ state: "current", message: "App actualizada" });
  });

  autoUpdater.on("download-progress", (progress) => {
    sendUpdaterStatus({
      state: "downloading",
      message: `Descargando actualizacion ${Math.round(progress.percent)}%`
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendUpdaterStatus({
      state: "downloaded",
      message: `Version ${info.version} lista. Se instalara al cerrar la app.`,
      readyToInstall: true
    });
  });

  autoUpdater.on("error", () => {
    sendUpdaterStatus({ state: "error", message: "No se pudo revisar actualizaciones" });
  });

  ipcMain.on("updater:install", () => {
    autoUpdater.quitAndInstall(false, true);
  });

  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  }
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
