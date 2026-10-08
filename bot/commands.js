// Obrada komandi; odvojeno od WhatsApp veze da bi moglo da se testira.
import {
  MEMBERS, parseKarma, tableText, describe, todayBelgrade, HELP, actionsText,
  nameOf, findMember, memberFromProfileName, ACTIONS,
} from "./karma.js";
import { birthdayText } from "./birthday.js";
import { update } from "./store.js";

// Komande od dve reči svode se na jednu: "!ko casti" → "!kocasti"
const TWO_WORD = { "!ko": ["casti", "časti", "dolazi"], "!ne": ["mogu", "dolazim"] };
const ALIASES = {
  "!pomoć": "!pomoc", "!help": "!pomoc", "!poništi": "!ponisti", "!kočasti": "!kocasti",
  "!druženje": "!druzenje", "!otkaži": "!otkazi", "!nedolazim": "!nemogu",
  "!rođendan": "!rodjendan", "!rodendan": "!rodjendan", "!čestitka": "!rodjendan", "!cestitka": "!rodjendan",
};

function parseCommand(text) {
  const parts = text.trim().split(/\s+/);
  let cmd = parts[0].toLowerCase();
  let i = 1;
  if (TWO_WORD[cmd] && parts[1] && TWO_WORD[cmd].includes(parts[1].toLowerCase())) {
    cmd = cmd + parts[1].toLowerCase().replace("č", "c");
    i = 2;
  }
  cmd = ALIASES[cmd] || cmd;
  return { cmd, args: parts.slice(i) };
}

const pick = list => list[Math.floor(Math.random() * list.length)];

function newEvent(ev) {
  ev.date = todayBelgrade();
  ev.createdAt = Date.now() + Math.floor(Math.random() * 1000);
  ev.id = "bot-" + ev.createdAt.toString(36) + Math.floor(Math.random() * 36 ** 3).toString(36);
  return ev;
}

function rosterText(d) {
  const yes = d.yes.map(nameOf);
  const no = d.no.map(nameOf);
  return [
    `📅 *${d.title}*`,
    `Organizuje: ${nameOf(d.organizer)}`,
    `✅ Dolaze (${yes.length}): ${yes.join(", ") || "još niko"}`,
    `❌ Ne mogu (${no.length}): ${no.join(", ") || "niko"}`,
  ].join("\n");
}

const CASTI_LINES = [
  "Kockice se vrte… 🎲🎲🎲",
  "Pitao sam kristalnu kuglu… 🔮",
  "Algoritam pravde je odlučio… ⚖️",
  "Bacam novčić koji niko od vas nema… 🪙",
];
const CASTI_ENDINGS = [
  "Novčanik napolje! 💸",
  "Nema izvlačenja, sudbina je rekla svoje. 🍻",
  "Ostali naručuju duplo. 😏",
  "Žalbe se primaju sledeće godine. 📭",
];

export function makeHandler(store, state) {
  /** Ko je poslao poruku: zapamćeni broj, pa ime profila. */
  async function senderMember(ctx) {
    const st = await state.get();
    if (ctx.senderId && st.senders[ctx.senderId]) return st.senders[ctx.senderId];
    const m = memberFromProfileName(ctx.pushName);
    if (m && ctx.senderId) { st.senders[ctx.senderId] = m.id; await state.save(); }
    return m ? m.id : null;
  }

  /** Imena iz argumenata, ili pošiljalac ako nema imena. */
  async function whoFromArgs(args, ctx) {
    const ids = [];
    for (const a of args.join(" ").replace(/,/g, " ").split(/\s+/).filter(Boolean)) {
      if (a.toLowerCase() === "i") continue;
      const m = findMember(a);
      if (!m) return { error: `Ne znam ko je "${a}".` };
      if (!ids.includes(m.id)) ids.push(m.id);
    }
    if (ids.length) return { ids };
    const me = await senderMember(ctx);
    if (!me) return { error: "Ne znam ko si 🙂 Napiši jednom !ja <tvoje ime>, npr. !ja Marko" };
    return { ids: [me] };
  }

  return async function handle(text, ctx = {}) {
    const { cmd, args } = parseCommand(text);
    const rest = args.join(" ");

    if (cmd === "!pomoc") return HELP;
    if (cmd === "!akcije") return actionsText();

    if (cmd === "!tabela") {
      const { events } = await store.load();
      return tableText(events);
    }

    if (cmd === "!karma") {
      const ev = parseKarma(rest);
      if (ev.error) return `⚠️ ${ev.error}`;
      newEvent(ev);
      const { events } = await update(store, list => { list.push(ev); }, `Bot: ${describe(ev)}`);
      return `✅ ${describe(ev)}\n\n${tableText(events)}`;
    }

    if (cmd === "!ponisti") {
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

    if (cmd === "!ja") {
      const m = findMember(args[0]);
      if (!m) return `Napiši svoje ime, npr. !ja Marko. Imena: ${MEMBERS.map(x => x.name).join(", ")}`;
      if (!ctx.senderId) return "Ne mogu da prepoznam tvoj broj.";
      const st = await state.get();
      st.senders[ctx.senderId] = m.id;
      await state.save();
      return `👋 Zapamtio sam: ti si ${m.name}.`;
    }

    if (cmd === "!rodjendan") {
      const m = findMember(args[0]);
      if (!m) return "Napiši kome, npr. !rodjendan Vanja";
      return birthdayText(m.id);
    }

    if (cmd === "!kocasti") {
      const st = await state.get();
      const d = st.druzenje;
      const pool = d && d.yes.length >= 2 ? d.yes : MEMBERS.map(m => m.id);
      const winner = nameOf(pick(pool));
      const from = d && d.yes.length >= 2 ? `među onima koji dolaze na "${d.title}"` : "među svim drugarićima";
      return `${pick(CASTI_LINES)}\n\nBiram ${from}…\n\n💰 Časti: *${winner}*!\n${pick(CASTI_ENDINGS)}`;
    }

    if (cmd === "!druzenje") {
      const st = await state.get();
      if (!rest) return st.druzenje ? rosterText(st.druzenje) : "Nema otvorenog druženja. Otvori ga sa npr. !druzenje Gradac subota 12h";
      if (st.druzenje) return `Već je otvoreno druženje:\n\n${rosterText(st.druzenje)}\n\nZatvori ga sa !bilo (upisuje poene) ili !otkazi.`;
      const org = await senderMember(ctx);
      if (!org) return "Ne znam ko si 🙂 Napiši jednom !ja <tvoje ime>, pa ponovo otvori druženje.";
      st.druzenje = { title: rest.slice(0, 100), organizer: org, yes: [org], no: [], openedAt: Date.now() };
      await state.save();
      return `🎉 Novo druženje!\n\n${rosterText(st.druzenje)}\n\nJavite se sa *!dolazim* ili *!ne mogu*.`;
    }

    if (cmd === "!dolazim" || cmd === "!nemogu" || cmd === "!nedolazim") {
      const st = await state.get();
      const d = st.druzenje;
      if (!d) return "Nema otvorenog druženja. Otvori ga sa npr. !druzenje Gradac subota 12h";
      const who = await whoFromArgs(args, ctx);
      if (who.error) return `⚠️ ${who.error}`;
      const yes = cmd === "!dolazim";
      for (const id of who.ids) {
        d.yes = d.yes.filter(x => x !== id);
        d.no = d.no.filter(x => x !== id);
        (yes ? d.yes : d.no).push(id);
      }
      await state.save();
      return rosterText(d);
    }

    if (cmd === "!kodolazi") {
      const st = await state.get();
      return st.druzenje ? rosterText(st.druzenje) : "Nema otvorenog druženja.";
    }

    if (cmd === "!otkazi") {
      const st = await state.get();
      if (!st.druzenje) return "Nema otvorenog druženja.";
      const title = st.druzenje.title;
      delete st.druzenje;
      await state.save();
      return `🚫 Druženje "${title}" je otkazano. Poeni nisu upisani.`;
    }

    if (cmd === "!bilo") {
      const st = await state.get();
      const d = st.druzenje;
      if (!d) return "Nema otvorenog druženja.";
      const org = ACTIONS.find(a => a.key === "organizovao");
      const dosao = ACTIONS.find(a => a.key === "dosao");
      const added = [newEvent({ who: [d.organizer], action: org.key, pts: org.pts, note: d.title })];
      if (d.yes.length) added.push(newEvent({ who: [...d.yes], action: dosao.key, pts: dosao.pts, note: d.title }));
      const { events } = await update(store, list => { list.push(...added); }, `Bot: druženje ${d.title}`);
      delete st.druzenje;
      await state.save();
      return `🥳 Druženje "${d.title}" je završeno!\n\n${added.map(e => "✅ " + describe(e)).join("\n")}\n\n${tableText(events)}`;
    }

    return null; // nepoznata komanda: ćuti
  };
}
