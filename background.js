import { TRACKED_DOMAINS, API_BASE } from "./config.js";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  let url;
  try {
    url = new URL(tab.url);
  } catch {
    return;
  }

  const matched = TRACKED_DOMAINS.find((d) => url.hostname.endsWith(d));
  if (!matched) return;

  const { token } = await chrome.storage.local.get("token");
  if (!token) return;

  try {
    await fetch(`${API_BASE}/screen-time/visits`, {
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
