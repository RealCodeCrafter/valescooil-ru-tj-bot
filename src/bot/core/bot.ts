// import { Bot } from 'grammy';
// import { BOT_TOKEN } from '../config';
// import { MyContext } from '../types/types';
// import { checkUserMiddleWare, i18n, sessionMiddleware } from './middleware';

// // --- BOT INIT ---
// if (!BOT_TOKEN) {
//   throw new Error("BOT_TOKEN is missing in environment/config!");
// }

// const bot = new Bot<MyContext>(BOT_TOKEN);

// // --- TEST COMMAND ---
// bot.command('test', async (ctx) => {
//   console.log("TEST COMMAND MESSAGE:", ctx.message);
//   await ctx.reply("Test komanda ishladi ✔️");
// });

// // --- MIDDLEWARES ---
// bot.use(sessionMiddleware);   // session
// bot.use(i18n.middleware());   // localization
// bot.use(checkUserMiddleWare); // user registration flow

// // --- COMMAND LIST ---
// bot.api.setMyCommands([
//   { command: 'start', description: 'Botni ishga tushirish' },
// ]);

// // --- GLOBAL ERROR HANDLER ---
// bot.catch((err) => {
//   console.error("Bot error caught:", err.error || err);
// });

// // --- BOT START ---
// bot.start({
//   onStart: (botInfo) => {
//     console.log(`Bot ishga tushdi: @${botInfo.username}`);
//   },
// });

// export default bot;



import { Bot } from "grammy";
import { BOT_TOKEN } from "../config";
import { MyContext } from "../types/types";
import { checkUserMiddleWare, i18n, sessionMiddleware } from "./middleware";

// --- Admin ID lar (number bo'lishi shart!) ---
const ADMIN_IDS = [
  5661241603,
  7546792114,
];

// --- BOT INIT ---
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in environment/config!");
}

const bot = new Bot<MyContext>(BOT_TOKEN);

// --- MIDDLEWARELAR (hamma uchun ishlaydi) ---
bot.use(sessionMiddleware);
bot.use(i18n.middleware());
bot.use(checkUserMiddleWare);

// --- ADMIN CHECK (faqat javob berishni cheklaydi) ---
bot.use(async (ctx, next) => {
  if (!ctx.from) return;

  // faqat adminlar reply oladi
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return; // to‘xtatamiz, userga hech narsa qaytmaydi
  }

  return next(); // admin bo‘lsa komandalariga ruxsat
});

// --- COMMANDLAR (faqat adminlar ishlata oladi) ---
bot.command("start", async (ctx) => {
  await ctx.reply("Bot ishga tushdi, admin!");
});

bot.command("test", async (ctx) => {
  console.log("TEST COMMAND MESSAGE:", ctx.message);
  await ctx.reply("Test komanda ishladi ✔️");
});

// --- COMMAND LIST ---
bot.api.setMyCommands([
  { command: "start", description: "Botni ishga tushirish" },
]);

// --- ERROR HANDLER ---
bot.catch((err) => {
  console.error("Bot error caught:", err.error || err);
});

// --- START ---
bot.start({
  onStart: (botInfo) => {
    console.log(`Bot ishga tushdi: @${botInfo.username}`);
  },
});

export default bot;
