// Rođendanske čestitke za !rodjendan. Bez mreže, pa se lako testira.
import { MEMBERS } from "./karma.js";

const pick = list => list[Math.floor(Math.random() * list.length)];

// Lične želje po članu. Dopiši ovde kad saznaš šta ko voli.
const PERSONAL = {
  vanja: {
    emoji: "🐱💃",
    wishes: [
      "Da ti ova godina bude kao dobar plesni podijum: puna muzike, smeha i ljudi koje voliš. 💃",
      "Da se sav trud koji ulažeš vrati duplo, i da imaš više vremena za ples nego za mejlove. 💪",
      "I da ti svaka mačka na svetu priđe sama od sebe, a nijedna ne ogrebe. 🐾",
    ],
  },
};

const OPENERS = [
  "Najbolji Drugarić bot javlja: danas slavimo",
  "Pažnja, pažnja! Danas slavi",
  "Sirene, konfete i torta, jer danas slavi",
  "Karma tabela se klanja, jer danas slavi",
];

const GENERIC = [
  "Da ti godina bude puna smeha, putovanja i dobrog društva. 🌍",
  "Da te zdravlje služi, a briga zaobilazi. 🍀",
  "Da imaš više razloga za slavlje nego dana u godini. 🥂",
  "Da ti se ostvari sve što poželiš, plus još malo preko toga. ✨",
];

const ENDINGS = [
  "Volimo te! ❤️\n*DRUGARIĆI*",
  "Uživaj, i da nas častiš uskoro! 🍰\n*DRUGARIĆI*",
  "Sve najlepše od cele ekipe! 🎈\n*DRUGARIĆI*",
];

export function birthdayText(memberId) {
  const m = MEMBERS.find(x => x.id === memberId);
  const p = PERSONAL[memberId];
  const wishes = p ? p.wishes : [...GENERIC].sort(() => Math.random() - 0.5).slice(0, 2);
  const emoji = p ? p.emoji : "🎂";
  return [
    `🎉${emoji} *Srećan rođendan, ${m.name}!* ${emoji}🎉`,
    "",
    `${pick(OPENERS)} *${m.name}*! 🥳`,
    "",
    ...wishes,
    "",
    pick(ENDINGS),
  ].join("\n");
}
