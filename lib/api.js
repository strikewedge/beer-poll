export async function loadConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to load config");
  return res.json();
}

export async function saveConfig(config) {
  const res = await fetch("/api/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to save config");
  return res.json();
}

export async function recordVote(picked, shown) {
  const res = await fetch("/api/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ picked, shown }),
  });
  if (res.status === 403) return { alreadyVoted: true };
  if (!res.ok) throw new Error("Failed to record vote");
  return res.json();
}

export async function loadResults() {
  const res = await fetch("/api/results");
  if (!res.ok) throw new Error("Failed to load results");
  return res.json();
}

export async function clearVotes() {
  const res = await fetch("/api/results", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to clear votes");
  return res.json();
}
