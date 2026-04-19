import { DEFAULT_TRACKED_DOMAINS, DEFAULT_API_BASE } from "./config.js";

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(["trackedDomains", "apiBase"]);
  if (!existing.trackedDomains) {
    await chrome.storage.local.set({ trackedDomains: DEFAULT_TRACKED_DOMAINS });
  }
  if (!existing.apiBase) {
    await chrome.storage.local.set({ apiBase: DEFAULT_API_BASE });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  let url;
  try {
    url = new URL(tab.url);
  } catch {
    return;
  }

  const { trackedDomains, apiBase, token } = await chrome.storage.local.get([
    "trackedDomains",
    "apiBase",
    "token",
  ]);

  const domains = trackedDomains || DEFAULT_TRACKED_DOMAINS;
  const base = apiBase || DEFAULT_API_BASE;

  const matched = domains.find((d) => url.hostname.endsWith(d));
  if (!matched) return;
  if (!token) return;

  try {
    await fetch(`${base}/screen-time/visits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        domain: matched,
        visitedAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("Failed to record visit:", err);
  }
});
