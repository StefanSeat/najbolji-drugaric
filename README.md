# Najbolji Drugarić

Karma tabla za WhatsApp grupu DRUGARIĆI. Prati ko je organizovao druženje, kupio poklon, častio, otišao na kafu, a ko je ispalio.

## Fajlovi

- `index.html` ceo sajt (jedna stranica, bez build koraka)
- `data.json` svi unosi poena
- `logo.png` logo grupe, `himna.mp3` himna drugarića

## Kako radi

- Na GitHub Pages sajt je samo za gledanje: čita poene iz `data.json`. Novi poeni se dodaju izmenom tog fajla.
- Na claude.ai isti sajt koristi deljenu bazu i ima formu za upis.

## Poeni

| Akcija | Poeni |
|---|---|
| Organizovao druženje | +5 |
| Kupio poklon | +5 |
| Častio ekipu | +3 |
| Vozio ekipu | +3 |
| Došao na druženje | +3 |
| Doprinos grupi | +3 |
| Otišao na kafu / pivo | +2 |
| Pomogao / doneo nešto | +2 |
| Čestitao rođendan / uspeh | +1 |
| Javio se na vreme | +1 |
| Podržao drugarića | +1 |
| Kasnio | -1 |
| Izbegao da časti | -2 |
| Ghostovao grupu | -2 |
| Ispalio | -3 |

Članovi i akcije se menjaju na vrhu skripte u `index.html` (`MEMBERS` i `ACTIONS`).
