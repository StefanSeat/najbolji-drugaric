// Lokalno stanje bota (otvoreno druženje, ko je koji broj). Čuva se u state.json pored bota.
import fs from "node:fs/promises";

export function makeState(file = process.env.STATE_FILE || "state.json") {
  let cache = null;
  return {
    async get() {
      if (cache) return cache;
      try { cache = JSON.parse(await fs.readFile(file, "utf8")); }
      catch (e) { if (e.code !== "ENOENT") throw e; cache = {}; }
      cache.senders ||= {};
      return cache;
    },
    async save() {
      if (cache) await fs.writeFile(file, JSON.stringify(cache, null, 1) + "\n");
    },
  };
}

export function memoryState(initial = {}) {
  const s = { senders: {}, ...initial };
  return { async get() { return s; }, async save() {} };
}
