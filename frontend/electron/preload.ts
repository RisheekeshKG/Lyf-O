// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

// ✅ Startup log
console.log("🔌 [Preload] Script loaded. Injecting APIs...");

// ✅ Allowed IPC channels (keep this in sync with main.ts)
const validInvokes = [
  // App
  "get-api-url",

  // File system
  "readDir",
  "statDir",
  "readFile",
  "writeFile",
  "deleteFile",

  // Gmail integration
  "gmail-auth",
  "gmail-exchange",
  "gmail-list",
  "gmail-get-message",
  "gmail-signout",
  "gmail-check-auth",
];


// ✅ Optional: Log allowed channels
console.log("📡 [Preload] Allowed IPC channels:", validInvokes);

// ✅ Expose safe bridge to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // ---- invoke (async calls to main) ----
  invoke: (channel: string, ...args: any[]) => {
    console.log(`[Preload → Renderer] invoke("${channel}")`, args);

    if (!validInvokes.includes(channel)) {
      const msg = `[Preload] ❌ Blocked invalid channel: ${channel}`;
      console.warn(msg);
      return Promise.reject(new Error("Invalid channel"));
    }

    return ipcRenderer.invoke(channel, ...args);
  },

  // ---- onMainMessage (listen to async messages from main) ----
  onMainMessage: (cb: (msg: string) => void) => {
    console.log("[Preload] Listening for 'fromMain' messages...");
    ipcRenderer.on("fromMain", (_e, m) => {
      console.log("📬 [Main → Renderer] Message:", m);
      cb(m);
    });
  },

  // ---- removeMainListener ----
  removeMainListener: () => {
    console.log("[Preload] Removed all 'fromMain' listeners.");
    ipcRenderer.removeAllListeners("fromMain");
  },
});

console.log("✅ [Preload] electronAPI successfully injected.");
