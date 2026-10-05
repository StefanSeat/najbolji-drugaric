// Čuvanje poena: data.json u GitHub repou (isti fajl koji čita sajt).
// Za probu bez GitHub-a postavi DATA_FILE=putanja/do/data.json.
import fs from "node:fs/promises";

const API = "https://api.github.com";

export function makeStore(env = process.env) {
  if (env.DATA_FILE) return localStore(env.DATA_FILE);
  for (const k of ["GITHUB_TOKEN", "GITHUB_REPO"]) if (!env[k]) throw new Error(`Fali ${k} u .env`);
  return githubStore({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO, branch: env.GITHUB_BRANCH || "main", path: env.DATA_PATH || "data.json" });
}

function localStore(file) {
  return {
    async load() {
      try { return { events: JSON.parse(await fs.readFile(file, "utf8")), version: null }; }
      catch (e) { if (e.code === "ENOENT") return { events: [], version: null }; throw e; }
    },
    async save(events) {
      await fs.writeFile(file, JSON.stringify(events, null, 1) + "\n");
    },
  };
}

function githubStore({ token, repo, branch, path }) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "najbolji-drugaric-bot" };
  const url = `${API}/repos/${repo}/contents/${path}`;
  return {
    async load() {
      const r = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers });
      if (r.status === 404) return { events: [], version: null };
      if (!r.ok) throw new Error(`GitHub čitanje nije uspelo (${r.status})`);
      const j = await r.json();
      return { events: JSON.parse(Buffer.from(j.content, "base64").toString("utf8")), version: j.sha };
    },
    async save(events, version, message) {
      const body = {
        message,
        branch,
        content: Buffer.from(JSON.stringify(events, null, 1) + "\n", "utf8").toString("base64"),
        ...(version ? { sha: version } : {}),
      };
      const r = await fetch(url, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.status === 409 || r.status === 422) { const e = new Error("conflict"); e.conflict = true; throw e; }
      if (!r.ok) throw new Error(`GitHub upis nije uspeo (${r.status})`);
    },
  };
}

/** Učita, izmeni i sačuva; ako je neko u međuvremenu menjao fajl, pokuša ponovo. */
export async function update(store, mutate, message, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const { events, version } = await store.load();
    const result = mutate(events);
    if (result === false) return { events, changed: false };
    try {
      await store.save(events, version, message);
      return { events, changed: true, result };
    } catch (e) {
      if (!e.conflict || i === tries - 1) throw e;
    }
  }
}
