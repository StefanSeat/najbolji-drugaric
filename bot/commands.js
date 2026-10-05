// Obrada komandi; odvojeno od WhatsApp veze da bi moglo da se testira.
import { parseKarma, tableText, describe, todayBelgrade, HELP, actionsText } from "./karma.js";
import { update } from "./store.js";

export function makeHandler(store) {
  return async function handle(text) {
  const [cmdRaw, ...restParts] = text.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase();
  const rest = restParts.join(" ");

  if (cmd === "!pomoc" || cmd === "!pomoć" || cmd === "!help") return HELP;
  if (cmd === "!akcije") return actionsText();

  if (cmd === "!tabela") {
    const { events } = await store.load();
    return tableText(events);
  }

  if (cmd === "!karma") {
    const ev = parseKarma(rest);
    if (ev.error) return `⚠️ ${ev.error}`;
    ev.date = todayBelgrade();
    ev.createdAt = Date.now();
    ev.id = "bot-" + ev.createdAt.toString(36);
    const { events } = await update(store, list => { list.push(ev); }, `Bot: ${describe(ev)}`);
    return `✅ ${describe(ev)}\n\n${tableText(events)}`;
  }

  if (cmd === "!ponisti" || cmd === "!poništi") {
    let removed = null;
    const { events, changed } = await update(store, list => {
      let idx = -1;
      list.forEach((e, i) => { if (String(e.id || "").startsWith("bot-") && (idx < 0 || (e.createdAt || 0) >= (list[idx].createdAt || 0))) idx = i; });
      if (idx < 0) return false;
      removed = list.splice(idx, 1)[0];
    }, "Bot: poništen poslednji unos");
    if (!changed) return "Nema unosa od bota koje mogu da poništim.";
    return `↩️ Obrisano: ${describe(removed)}\n\n${tableText(events)}`;
  }

  return null; // nepoznata komanda: ćuti
}
}
