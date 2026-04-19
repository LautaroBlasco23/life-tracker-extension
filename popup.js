import { API_BASE } from "./config.js";

async function showStats(token) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("stats-section").style.display = "block";

  const today = new Date().toISOString().split("T")[0];
  const res = await fetch(`${API_BASE}/screen-time/stats?from=${today}&to=${today}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();

  const statsEl = document.getElementById("stats");
  if (!json.data || json.data.length === 0) {
    statsEl.innerHTML = "<p>No visits today.</p>";
    return;
  }
  statsEl.innerHTML = json.data
    .map((s) => `<div class="stat-row"><span>${s.domain}</span><strong>${s.count}</strong></div>`)
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const { token } = await chrome.storage.local.get("token");
  if (token) {
    showStats(token);
  }

  document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      document.getElementById("login-error").textContent = "Invalid credentials";
      return;
    }

    const json = await res.json();
    const accessToken = json.data?.accessToken;
    if (!accessToken) {
      document.getElementById("login-error").textContent = "Login failed";
      return;
    }

    await chrome.storage.local.set({ token: accessToken });
    showStats(accessToken);
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await chrome.storage.local.remove("token");
    document.getElementById("stats-section").style.display = "none";
    document.getElementById("login-section").style.display = "block";
  });
});
