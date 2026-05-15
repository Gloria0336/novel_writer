import { app, BrowserWindow, Menu, shell } from "electron";
import { join } from "node:path";
import { gameLogStore, registerGameLogIpc } from "./gameLogIpc";

const isDev = !app.isPackaged;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "星落戰紀",
    backgroundColor: "#1a1a1a",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  win.on("close", () => {
    gameLogStore.abandonAll("window closed");
  });
  win.webContents.on("render-process-gone", () => {
    gameLogStore.abandonAll("renderer process gone");
  });

  return win;
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "遊戲",
      submenu: [
        { label: "重新開始", accelerator: "CmdOrCtrl+R", role: "reload" },
        { type: "separator" },
        { label: "離開", accelerator: "CmdOrCtrl+Q", role: "quit" },
      ],
    },
    {
      label: "檢視",
      submenu: [
        { label: "全螢幕", accelerator: "F11", role: "togglefullscreen" },
        { label: "開發者工具", accelerator: "F12", role: "toggleDevTools" },
        { type: "separator" },
        { label: "縮放重置", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
        { label: "放大", accelerator: "CmdOrCtrl+Plus", role: "zoomIn" },
        { label: "縮小", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  registerGameLogIpc();
  buildMenu();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("before-quit", () => {
  gameLogStore.abandonAll("app before-quit");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
