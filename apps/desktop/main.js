const { app, BrowserWindow, protocol, net, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

// Đăng ký giao thức chuẩn bảo mật nội bộ cho giao diện tĩnh Next.js (không mở port, không bị tường lửa chặn)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function getDbFilePath() {
  return path.join(app.getPath("userData"), "content-studio-db.json");
}

function readDbFromDisk() {
  try {
    const p = getDbFilePath();
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf-8");
    }
  } catch (err) {
    console.error("Failed reading DB file:", err);
  }
  return null;
}

function writeDbToDisk(serialized) {
  try {
    const p = getDbFilePath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = `${p}.tmp`;
    fs.writeFileSync(tmp, serialized, "utf-8");
    fs.renameSync(tmp, p);
    return true;
  } catch (err) {
    console.error("Failed writing DB file:", err);
    return false;
  }
}

let mainWindow = null;

function buildAppMenu() {
  const template = [
    {
      label: "Tệp & Dữ liệu",
      submenu: [
        {
          label: "Sao lưu dữ liệu sang máy khác (.json)...",
          accelerator: "CmdOrCtrl+S",
          click: async () => {
            const raw = readDbFromDisk();
            if (!raw) {
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Sao lưu dữ liệu",
                message: "Chưa có dữ liệu phát sinh để sao lưu.",
              });
              return;
            }
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
              title: "Lưu file sao lưu AI Content Studio",
              defaultPath: `ai-content-studio-backup-${new Date().toISOString().slice(0, 10)}.json`,
              filters: [{ name: "JSON Backup", extensions: ["json"] }],
            });
            if (!canceled && filePath) {
              fs.writeFileSync(filePath, raw, "utf-8");
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Sao lưu thành công",
                message: `Đã xuất toàn bộ bài viết, Bộ não thứ 2 & Skill ra file:\n${filePath}`,
              });
            }
          },
        },
        {
          label: "Khôi phục dữ liệu từ file (.json)...",
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: "Chọn file sao lưu AI Content Studio (.json)",
              properties: ["openFile"],
              filters: [{ name: "JSON Backup", extensions: ["json"] }],
            });
            if (!canceled && filePaths && filePaths[0]) {
              try {
                const content = fs.readFileSync(filePaths[0], "utf-8");
                JSON.parse(content);
                writeDbToDisk(content);
                if (mainWindow) mainWindow.reload();
                dialog.showMessageBox(mainWindow, {
                  type: "info",
                  title: "Khôi phục thành công",
                  message: "Đã nạp toàn bộ dữ liệu vào ứng dụng!",
                });
              } catch {
                dialog.showErrorBox("Lỗi định dạng", "File sao lưu không hợp lệ.");
              }
            }
          },
        },
        {
          label: "Mở thư mục lưu dữ liệu trên máy",
          click: () => {
            shell.openPath(app.getPath("userData"));
          },
        },
        { type: "separator" },
        { label: "Thoát", role: "quit" },
      ],
    },
    {
      label: "Chỉnh sửa",
      submenu: [
        { label: "Hoàn tác", role: "undo" },
        { label: "Làm lại", role: "redo" },
        { type: "separator" },
        { label: "Cắt", role: "cut" },
        { label: "Sao chép", role: "copy" },
        { label: "Dán", role: "paste" },
        { label: "Chọn tất cả", role: "selectAll" },
      ],
    },
    {
      label: "Hiển thị",
      submenu: [
        { label: "Tải lại giao diện", role: "reload" },
        { label: "Phóng to", role: "zoomIn" },
        { label: "Thu nhỏ", role: "zoomOut" },
        { label: "Kích thước mặc định", role: "resetZoom" },
        { type: "separator" },
        { label: "Toàn màn hình", role: "togglefullscreen" },
        { label: "Công cụ kiểm tra (DevTools)", role: "toggleDevTools" },
      ],
    },
    {
      label: "Trợ giúp",
      submenu: [
        {
          label: "Mở phiên bản Web Online",
          click: () => shell.openExternal("https://lunngochoamx-prog.github.io/ai-content-studio/"),
        },
        {
          label: "Trang GitHub & Bản cập nhật mới",
          click: () => shell.openExternal("https://github.com/lunngochoamx-prog/ai-content-studio/releases"),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: "AI Content Studio — Ứng Dụng Viết Content Đa Ngành Nghề & Bộ Não Thứ 2",
    icon: path.join(__dirname, "assets", "icon.png"),
    backgroundColor: "#F7F5F0",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.loadURL("app://contentstudio/");
}

app.whenReady().then(() => {
  const webRoot = path.join(__dirname, "web-out");

  protocol.handle("app", (request) => {
    const u = new URL(request.url);
    let relPath = decodeURIComponent(u.pathname);

    if (relPath.startsWith("/api/")) {
      return new Response(JSON.stringify({ mode: "desktop_standalone" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (!relPath || relPath === "/") {
      relPath = "/index.html";
    }
    let targetPath = path.normalize(path.join(webRoot, relPath));
    if (!targetPath.startsWith(webRoot)) {
      targetPath = path.join(webRoot, "index.html");
    }
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
    }
    if (!fs.existsSync(targetPath)) {
      targetPath = path.join(webRoot, "index.html");
    }
    return net.fetch(pathToFileURL(targetPath).toString());
  });

  // IPC lưu trữ ổ cứng
  ipcMain.on("db:readSync", (event) => {
    event.returnValue = readDbFromDisk();
  });

  ipcMain.handle("db:write", (_event, serialized) => {
    return writeDbToDisk(serialized);
  });

  // IPC gọi mạng trực tiếp từ tiến trình chính (không bị chặn CORS khi gọi Ollama Local / 9Router / Cloud API)
  ipcMain.handle("net:fetch", async (_event, opts) => {
    try {
      const res = await fetch(opts.url, {
        method: opts.method || "GET",
        headers: opts.headers || {},
        body: opts.body,
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    } catch (err) {
      return { ok: false, status: 0, text: String(err) };
    }
  });

  buildAppMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
