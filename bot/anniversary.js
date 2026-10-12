// Čestitke za godišnjicu braka (!godisnjica). Bez mreže, pa se lako testira.
import { MEMBERS } from "./karma.js";

const pick = list => list[Math.floor(Math.random() * list.length)];

const ORDINAL = { 1: "prva", 2: "druga", 3: "treća", 4: "četvrta", 5: "peta", 10: "deseta" };

// Lične želje po članu. Dopiši ovde kad saznaš nešto o paru.
const PERSONAL = {
  djina: {
    years: 1,
    emoji: "🇮🇹🍝",
    wishes: [
      "Uživajte u Rimu do poslednje kapi espressa! Da vam svaka ulica bude šetnja za pamćenje, a svaki zalazak sunca samo vaš. ☕🌅",
      "Bacite novčić u Fontanu di Trevi, da se u Rim vraćate još mnogo puta, i to uvek zajedno. 🪙⛲",
    ],
  },
};

const GENERIC = [
  "Da vam ljubav bude sve jača, a svađe sve kraće. ❤️",
  "Da se i dalje smejete jedno drugom kao prvog dana. 😄",
  "Da vam dom uvek bude pun topline, mira i dobrog društva. 🏡",
  "Da zajedno proputujete pola sveta, a drugu polovinu ostavite za sledeće godišnjice. 🌍",
  "Da vam svaka sledeća godina bude lepša od prethodne. ✨",
];

const ENDINGS = [
  "Volimo vas! ❤️\n*DRUGARIĆI*",
  "Živeli, i da nas častite kad se vratite! 🥂\n*DRUGARIĆI*",
  "Sve najlepše od cele ekipe! 💐\n*DRUGARIĆI*",
];

export function anniversaryText(memberId) {
  const m = MEMBERS.find(x => x.id === memberId);
  const p = PERSONAL[memberId] || {};
  const which = ORDINAL[p.years] ? `${ORDINAL[p.years]} ` : "";
  const general = [...GENERIC].sort(() => Math.random() - 0.5).slice(0, p.wishes ? 2 : 3);
  const emoji = p.emoji || "💍";
  return [
    `💍${emoji} *Srećna ${which}godišnjica braka, ${m.name}!* ${emoji}💍`,
    "",
    p.years === 1
      ? "Prva godina iza vas, a tek je počelo ono najlepše! 🥂"
      : "Još jedna godina ljubavi iza vas, a najlepše tek dolazi! 🥂",
    "",
    ...(p.wishes || []),
    ...general,
    "",
    pick(ENDINGS),
  ].join("\n");
}
