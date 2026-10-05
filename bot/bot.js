// WhatsApp karma bot: odgovara samo na komande koje počinju sa "!".
// Ne čita, ne čuva i ne šalje dalje ostale poruke iz grupe.
import "dotenv/config";
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import { makeStore } from "./store.js";
import { makeHandler } from "./commands.js";

const GROUP_ID = process.env.GROUP_ID || "";
const handle = makeHandler(makeStore());
const log = pino({ level: process.env.LOG_LEVEL || "warn" });

function textOf(msg) {
  const m = msg.message || {};
  return m.conversation || m.extendedTextMessage?.text || "";
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(process.env.AUTH_DIR || "auth");
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, logger: log, markOnlineOnConnect: false });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("Skeniraj ovaj QR kod telefonom bota: WhatsApp > Povezani uređaji > Poveži uređaj");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") console.log(GROUP_ID ? `Bot je povezan i sluša grupu ${GROUP_ID}` : "Bot je povezan. Napiši !grupa u grupi da dobiješ GROUP_ID.");
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log("Bot je odjavljen sa telefona. Obriši folder auth i pokreni ponovo da skeniraš novi QR.");
        process.exit(1);
      }
      console.log("Veza prekinuta, ponovo se povezujem…");
      setTimeout(start, 3000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      const jid = msg.key.remoteJid || "";
      const text = textOf(msg);
      if (!text.startsWith("!")) continue; // sve ostalo se ignoriše

      if (text.trim().toLowerCase() === "!grupa") {
        if (jid.endsWith("@g.us")) await sock.sendMessage(jid, { text: `GROUP_ID=${jid}` }, { quoted: msg });
        continue;
      }
      if (!GROUP_ID || jid !== GROUP_ID) continue; // radi samo u grupi Drugarići

      try {
        const reply = await handle(text);
        if (reply) await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      } catch (e) {
        console.error(e);
        await sock.sendMessage(jid, { text: "⚠️ Nisam uspeo da upišem poene, probaj ponovo za minut." }, { quoted: msg });
      }
    }
  });
}

start();
