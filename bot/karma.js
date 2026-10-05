// Čista logika bota: članovi, akcije, parsiranje komandi i tabela.
// Nema mreže ni WhatsApp-a ovde, pa se lako testira (npm test).

export const SEASON_START = "2026-01-01";

export const MEMBERS = [
  { id: "marko", name: "Marko", aliases: ["marko", "mare", "cavoski"] },
  { id: "vanja", name: "Vanja", aliases: ["vanja", "vanjo"] },
  { id: "nemanja", name: "Nemanja", aliases: ["nemanja", "nemanji", "nemanju", "kapi", "karapandza", "karapandzic"] },
  { id: "aleksandar", name: "Aleksandar", aliases: ["aleksandar", "aleksandra", "aleks", "alex", "macak", "aca", "petrovic"] },
  { id: "djina", name: "Đurdjina", aliases: ["djina", "dina", "djino", "djurdjina", "durdjina", "djurdja"] },
  { id: "stefan", name: "Stefan", aliases: ["stefan", "stef", "stefanu", "seat"] },
  { id: "milos", name: "Miloš", aliases: ["milos", "mikan", "mikane", "milosu"] },
  { id: "tara", name: "Tara", aliases: ["tara", "tari", "taru", "tarica"] },
  { id: "ksenija", name: "Ksenija", aliases: ["ksenija", "kseniji", "kseniju", "ks"] },
];

export const ACTIONS = [
  { key: "organizovao", label: "Organizovao druženje", pts: 5, aliases: ["organizovao", "organizovala", "organizovali", "organizacija", "org"] },
  { key: "poklon", label: "Kupio poklon", pts: 5, aliases: ["poklon", "kupio", "kupila", "kupili"] },
  { key: "castio", label: "Častio ekipu", pts: 3, aliases: ["castio", "castila", "castili", "castile", "casti", "ugostio", "ugostila"] },
  { key: "vozio", label: "Vozio ekipu", pts: 3, aliases: ["vozio", "vozila", "vozili", "prevoz"] },
  { key: "dosao", label: "Došao na druženje", pts: 3, aliases: ["dosao", "dosla", "dosli", "dosle", "doslo", "bio", "bila", "bili"] },
  { key: "kafa", label: "Otišao na kafu / pivo", pts: 2, aliases: ["kafa", "kafu", "pivo", "pice"] },
  { key: "pomogao", label: "Pomogao / doneo nešto", pts: 2, aliases: ["pomogao", "pomogla", "pomogli", "doneo", "donela", "doneli"] },
  { key: "doprinos", label: "Doprinos grupi", pts: 3, aliases: ["doprinos"] },
  { key: "cestitao", label: "Čestitao rođendan / uspeh", pts: 1, aliases: ["cestitao", "cestitala", "cestitali", "cestitka"] },
  { key: "potvrdio", label: "Javio se na vreme", pts: 1, aliases: ["potvrdio", "potvrdila", "potvrdili", "javio", "javila"] },
  { key: "podrska", label: "Podržao drugarića", pts: 1, aliases: ["podrska", "podrzao", "podrzala"] },
  { key: "kasnio", label: "Kasnio", pts: -1, aliases: ["kasnio", "kasnila", "kasnili", "kasni"] },
  { key: "nijecastio", label: "Izbegao da časti", pts: -2, aliases: ["nijecastio", "nijecastila", "izbegao", "izbegla", "stipsa"] },
  { key: "ghost", label: "Ghostovao grupu", pts: -2, aliases: ["ghost", "ghostovao", "ghostovala", "nestao", "nestala"] },
  { key: "ispalio", label: "Ispalio", pts: -3, aliases: ["ispalio", "ispalila", "ispalili", "ispali", "otkazao", "otkazala"] },
];

export const MAX_PTS = 20;

export function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+\-]/g, "");
}

const memberByAlias = new Map();
for (const m of MEMBERS) for (const a of [m.id, ...m.aliases]) memberByAlias.set(norm(a), m);
const actionByAlias = new Map();
for (const a of ACTIONS) for (const al of [a.key, ...a.aliases]) actionByAlias.set(norm(al), a);

export const nameOf = id => MEMBERS.find(m => m.id === id)?.name || id;

export function fmtPts(n) {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
}

/**
 * Parsira tekst posle "!karma".
 * Oblik: <imena> <akcija | +N | -N> [razlog]
 * Imena se odvajaju razmakom, zarezom ili rečju "i".
 * Vraća { who, action, label, pts, note } ili { error }.
 */
export function parseKarma(text) {
  const tokens = String(text || "").replace(/,/g, " ").split(/\s+/).filter(Boolean);
  const who = [];
  let i = 0;
  for (; i < tokens.length; i++) {
    const t = norm(tokens[i]);
    if (t === "i" || t === "") continue;
    const m = memberByAlias.get(t);
    if (!m) break;
    if (!who.includes(m.id)) who.push(m.id);
  }
  if (!who.length) {
    return { error: tokens.length ? `Ne znam ko je "${tokens[0]}". Probaj npr: !karma Marko +3 častio` : "Napiši ko i šta, npr: !karma Marko +3 častio" };
  }
  if (i >= tokens.length) return { error: "Fali akcija ili poeni, npr: !karma Marko +3 častio ili !karma Marko castio" };

  const head = tokens[i];
  const num = /^[+\-−]\d{1,3}$/.test(head) ? Number(head.replace("−", "-")) : null;
  let action, pts, rest;
  if (num !== null) {
    pts = num;
    rest = tokens.slice(i + 1);
    // Ako posle broja stoji poznata akcija, uzmi njen naziv, ali zadrži broj koji je neko napisao
    const maybe = rest.length ? actionByAlias.get(norm(rest[0])) : null;
    if (maybe) { action = maybe; rest = rest.slice(1); }
  } else {
    action = actionByAlias.get(norm(head));
    if (!action) return { error: `Ne znam akciju "${head}". Napiši poene (npr. +3) ili neku od: ${ACTIONS.map(a => a.key).join(", ")}` };
    pts = action.pts;
    rest = tokens.slice(i + 1);
  }
  if (!Number.isFinite(pts) || pts === 0) return { error: "Poeni moraju biti broj različit od nule, npr. +3 ili -2" };
  if (Math.abs(pts) > MAX_PTS) return { error: `Najviše ${MAX_PTS} poena odjednom.` };

  const note = rest.join(" ").slice(0, 140);
  const ev = { who, action: action ? action.key : "custom", pts, note };
  if (!action) ev.label = note || (pts > 0 ? "Bonus" : "Minus");
  return ev;
}

export function seasonEvents(events, start = SEASON_START) {
  return events.filter(e => (e.date || "") >= start);
}

export function scores(events) {
  const s = Object.fromEntries(MEMBERS.map(m => [m.id, 0]));
  for (const e of events) for (const w of e.who || []) if (w in s) s[w] += Number(e.pts) || 0;
  return MEMBERS.map(m => ({ id: m.id, name: m.name, pts: s[m.id] }))
    .sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name, "sr"));
}

export function tableText(events) {
  const ranked = scores(seasonEvents(events));
  const medal = ["🥇", "🥈", "🥉"];
  const lines = ranked.map((r, i) => `${medal[i] || `${i + 1}.`} ${r.name} ${r.pts}`);
  return `🏆 *Najbolji drugarić 2026*\n${lines.join("\n")}`;
}

export function describe(ev) {
  const a = ACTIONS.find(x => x.key === ev.action);
  const label = ev.label || (a ? a.label : "");
  const names = ev.who.map(nameOf).join(", ");
  const each = ev.who.length > 1 ? " svako" : "";
  const extra = ev.note && ev.label !== ev.note ? ` (${ev.note})` : "";
  return `${names} ${fmtPts(ev.pts)}${each} · ${label}${extra}`;
}

export function todayBelgrade(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const HELP = [
  "🍀 *Karma bot*",
  "",
  "*!karma <ko> <akcija ili poeni> [razlog]*",
  "  !karma Marko castio",
  "  !karma Tara Đina +3 došle na kafu",
  "  !karma Mikan ispalio Gradac",
  "",
  "*!tabela* trenutni poeni za 2026.",
  "*!ponisti* briše poslednji unos koji je bot upisao",
  "*!akcije* spisak akcija i poena",
  "*!pomoc* ova poruka",
].join("\n");

export function actionsText() {
  return "*Akcije*\n" + ACTIONS.map(a => `${a.key}: ${fmtPts(a.pts)} (${a.label})`).join("\n") + "\nIli bilo koji broj, npr. +4 ili -2";
}
