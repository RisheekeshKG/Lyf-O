/** The renderer boots before preload finishes injecting `electronAPI`. */
export async function waitForElectronAPI(timeoutMs = 1000): Promise<boolean> {
  const step = 50;
  for (let waited = 0; waited < timeoutMs; waited += step) {
    if (window.electronAPI) return true;
    await new Promise((resolve) => setTimeout(resolve, step));
  }
  return Boolean(window.electronAPI);
}

export async function invoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  await waitForElectronAPI();
  if (!window.electronAPI) {
    throw new Error(`electronAPI unavailable — cannot invoke "${channel}"`);
  }
  return window.electronAPI.invoke(channel, ...args);
}

export const isElectron = () => Boolean(window.electronAPI);
