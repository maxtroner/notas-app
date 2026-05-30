const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("notasUpdater", {
  onStatus(callback) {
    ipcRenderer.on("updater:status", (_event, payload) => callback(payload));
  },
  installUpdate() {
    ipcRenderer.send("updater:install");
  }
});
