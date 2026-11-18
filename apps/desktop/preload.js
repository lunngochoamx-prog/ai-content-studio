const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronStudio", {
  isDesktop: true,
  readDbSync: () => ipcRenderer.sendSync("db:readSync"),
  writeDb: (serialized) => ipcRenderer.invoke("db:write", serialized),
  proxyFetch: (opts) => ipcRenderer.invoke("net:fetch", opts),
});
