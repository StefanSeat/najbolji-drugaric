import { test } from "node:test";
import assert from "node:assert/strict";
import { parseKarma, scores, tableText, describe } from "./karma.js";

test("akcija sa podrazumevanim poenima", () => {
  const e = parseKarma("Marko castio");
  assert.deepEqual(e.who, ["marko"]);
  assert.equal(e.action, "castio");
  assert.equal(e.pts, 3);
});

test("više imena, broj i razlog", () => {
  const e = parseKarma("Tara, Đina i Mikan +3 došle na kafu");
  assert.deepEqual(e.who, ["tara", "djina", "milos"]);
  assert.equal(e.pts, 3);
  assert.equal(e.action, "dosao");
  assert.equal(e.note, "na kafu");
});

test("broj bez akcije daje custom", () => {
  const e = parseKarma("Stef -2 zaboravio igru");
  assert.equal(e.action, "custom");
  assert.equal(e.pts, -2);
  assert.equal(e.label, "zaboravio igru");
});

test("minus akcija", () => {
  const e = parseKarma("Djina ispalila Adu");
  assert.equal(e.pts, -3);
  assert.equal(e.note, "Adu");
});

test("greške", () => {
  assert.ok(parseKarma("Goran +3").error);
  assert.ok(parseKarma("Marko").error);
  assert.ok(parseKarma("Marko pevao").error);
  assert.ok(parseKarma("Marko +50").error);
  assert.ok(parseKarma("").error);
});

test("tabela računa samo 2026", () => {
  const ev = [
    { who: ["marko"], pts: 5, date: "2025-12-01" },
    { who: ["marko", "tara"], pts: 3, date: "2026-02-01" },
  ];
  const t = tableText(ev);
  assert.match(t, /Marko 3/);
  assert.match(t, /Tara 3/);
  assert.equal(scores(ev).find(r => r.id === "marko").pts, 8);
});

test("opis unosa", () => {
  assert.equal(describe({ who: ["marko", "tara"], pts: 3, action: "castio", note: "" }), "Marko, Tara +3 svako · Častio ekipu");
});

test("komande kroz handler (lokalni fajl)", async () => {
  const { makeHandler } = await import("./commands.js");
  const { memoryState } = await import("./state.js");
  const events = [];
  const store = { async load() { return { events: structuredClone(events), version: null }; }, async save(list) { events.splice(0, events.length, ...list); } };
  const handle = makeHandler(store, memoryState());
  const r1 = await handle("!karma Marko castio rođendan");
  assert.match(r1, /✅ Marko \+3/);
  assert.match(r1, /Marko 3/);
  assert.equal(events.length, 1);
  assert.match(await handle("!tabela"), /Najbolji drugarić 2026/);
  assert.match(await handle("!ponisti"), /Obrisano/);
  assert.equal(events.length, 0);
  assert.match(await handle("!ponisti"), /Nema unosa/);
  assert.match(await handle("!karma Goran +1"), /⚠️/);
  assert.equal(await handle("!nesto"), null);
});

test("druženje: otvori, prijave, bilo", async () => {
  const { makeHandler } = await import("./commands.js");
  const { memoryState } = await import("./state.js");
  const events = [];
  const store = { async load() { return { events: structuredClone(events), version: null }; }, async save(list) { events.splice(0, events.length, ...list); } };
  const handle = makeHandler(store, memoryState());
  const nem = { senderId: "381601@s.whatsapp.net", pushName: "Nemanja Karapandzic" };
  const mik = { senderId: "381602@s.whatsapp.net", pushName: "Milos Glovo" };
  const nep = { senderId: "381609@s.whatsapp.net", pushName: "Xyz" };

  assert.match(await handle("!dolazim", mik), /Nema otvorenog/);
  assert.match(await handle("!druzenje Gradac subota 12h", nem), /Organizuje: Nemanja/);
  assert.match(await handle("!druzenje Nesto drugo", mik), /Već je otvoreno/);
  assert.match(await handle("!dolazim", mik), /Dolaze \(2\): Nemanja, Miloš/);
  assert.match(await handle("!dolazim", nep), /!ja/);
  assert.match(await handle("!ja Tara", nep), /Tara/);
  assert.match(await handle("!dolazim", nep), /Dolaze \(3\)/);
  assert.match(await handle("!ne mogu Đina", nem), /Ne mogu \(1\): Đurdjina/);
  assert.match(await handle("!ne mogu", mik), /Dolaze \(2\)/);
  assert.match(await handle("!ko dolazi", nem), /Gradac/);
  const casti = await handle("!ko casti", nem);
  assert.match(casti, /Časti: \*(Nemanja|Tara)\*/);
  const bilo = await handle("!bilo", nem);
  assert.match(bilo, /Nemanja \+5 · Organizovao/);
  assert.match(bilo, /Nemanja, Tara \+3 svako · Došao/);
  assert.equal(events.length, 2);
  assert.match(await handle("!bilo", nem), /Nema otvorenog/);
  assert.match(await handle("!kocasti", nem), /Časti: \*/);
});

test("rođendanska čestitka", async () => {
  const { makeHandler } = await import("./commands.js");
  const handle = makeHandler({}, {});
  const t = await handle("!rodjendan Vanja");
  assert.match(t, /Srećan rođendan, Vanja/);
  assert.match(t, /ples/);
  assert.match(t, /mačka/);
  assert.match(await handle("!rođendan mikan"), /Srećan rođendan, Miloš/);
  assert.match(await handle("!rodjendan"), /Napiši kome/);
});
