import bot from '../core/bot';
import { CallbackActions } from '../types/enum';
import { isAdmin } from '../config';
import { Code } from '../../db/entities/code.entity';
import { Winner } from '../../db/entities/winner.entity';
import { AppDataSource } from '../../db/connect.db';
import { InlineKeyboard } from 'grammy';
import { IsNull } from 'typeorm';

// Admin session state
const adminSessions = new Map<number, {
  mode: 'upload_codes' | 'upload_winners' | 'upload_images' | null;
  imageType: 'premium' | 'standard' | 'economy' | 'symbolic' | null;
  winnerTier: 'premium' | 'standard' | 'economy' | 'symbolic' | null;
  selectedMonth: string | null;
}>();

function getAdminSession(userId: number) {
  if (!adminSessions.has(userId)) {
    adminSessions.set(userId, { mode: null, imageType: null, winnerTier: null, selectedMonth: null });
  }
  return adminSessions.get(userId)!;
}

// Oylar ro'yxati
const months = [
  { value: 'yanvar', label: 'Yanvar' },
  { value: 'fevral', label: 'Fevral' },
  { value: 'mart', label: 'Mart' },
  { value: 'aprel', label: 'Aprel' },
  { value: 'may', label: 'May' },
  { value: 'iyun', label: 'Iyun' },
  { value: 'iyul', label: 'Iyul' },
  { value: 'avgust', label: 'Avgust' },
  { value: 'sentabr', label: 'Sentabr' },
  { value: 'oktabr', label: 'Oktabr' },
  { value: 'noyabr', label: 'Noyabr' },
  { value: 'dekabr', label: 'Dekabr' },
];

function getMonthKeyboard(prefix: string) {
  const keyboard = new InlineKeyboard();
  for (let i = 0; i < months.length; i += 2) {
    if (i + 1 < months.length) {
      keyboard
        .text(months[i].label, `${prefix}_${months[i].value}`)
        .text(months[i + 1].label, `${prefix}_${months[i + 1].value}`)
        .row();
    } else {
      keyboard.text(months[i].label, `${prefix}_${months[i].value}`).row();
    }
  }
  keyboard.text('⬅️ Orqaga', CallbackActions.ADMIN_UPLOAD_CODES);
  return keyboard;
}

// Admin menu keyboard
function getAdminKeyboard() {
  return new InlineKeyboard()
    .text('📥 Kodlar kiritish', CallbackActions.ADMIN_UPLOAD_CODES)
    .row()
    .text('🎁 G\'olib kodlarni kiritish', CallbackActions.ADMIN_UPLOAD_WINNERS)
    .row()
    .text('📊 Oddiy kodlarni ko\'rish', CallbackActions.ADMIN_VIEW_CODES)
    .row()
    .text('📈 G\'olib kodlarni ko\'rish', CallbackActions.ADMIN_VIEW_WINNERS)
    .row()
    .text('🗑️ Kodlarni tozalash', CallbackActions.ADMIN_CLEAR_CODES)
    .row()
    .text('🗑️ G\'olib kodlarni tozalash', CallbackActions.ADMIN_CLEAR_WINNERS)
    .row()
    .text('🖼️ Rasmlarni yuklash', CallbackActions.ADMIN_UPLOAD_IMAGES);
}

// Upload codes
bot.callbackQuery(CallbackActions.ADMIN_UPLOAD_CODES, async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  const session = getAdminSession(ctx.from.id);
  session.mode = 'upload_codes';
  session.selectedMonth = null;

  await ctx.answerCallbackQuery('✅ Kodlar kiritish rejimi');

  const monthKeyboard = getMonthKeyboard('admin_upload_codes_month');
  
  try {
    await ctx.editMessageText(
      '📥 <b>Kodlar kiritish</b>\n\nAvval qaysi oy uchun kodlar kiritmoqchisiz?',
      { 
        parse_mode: 'HTML',
        reply_markup: monthKeyboard,
      },
    );
  } catch (error: any) {
    // Agar xabar o'zgartirib bo'lmasa, yangi xabar yuboramiz
    if (error.error_code === 400 && error.description?.includes('not modified')) {
      await ctx.reply(
        '📥 <b>Kodlar kiritish</b>\n\nAvval qaysi oy uchun kodlar kiritmoqchisiz?',
        { 
          parse_mode: 'HTML',
          reply_markup: monthKeyboard,
        },
      );
    } else {
      throw error;
    }
  }
});

// Oy tanlash handler (kodlar uchun)
bot.callbackQuery(new RegExp(`^admin_upload_codes_month_(.+)$`), async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  const match = ctx.callbackQuery.data.match(/^admin_upload_codes_month_(.+)$/);
  if (!match) return;

  const month = match[1];
  const session = getAdminSession(ctx.from.id);
  session.mode = 'upload_codes';
  session.selectedMonth = month;

  const monthLabel = months.find(m => m.value === month)?.label || month;

  await ctx.answerCallbackQuery(`✅ ${monthLabel} tanlandi`);
  
  try {
    await ctx.editMessageText(
      `📥 <b>Kodlar kiritish - ${monthLabel}</b>\n\nExcel/CSV/TXT fayl yuboring.\nFayl yuborilgach, kodlar avtomatik ravishda bazaga saqlanadi.`,
      { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      },
    );
  } catch (error: any) {
    if (error.error_code === 400 && error.description?.includes('not modified')) {
      await ctx.reply(
        `📥 <b>Kodlar kiritish - ${monthLabel}</b>\n\nExcel/CSV/TXT fayl yuboring.\nFayl yuborilgach, kodlar avtomatik ravishda bazaga saqlanadi.`,
        { 
          parse_mode: 'HTML',
          reply_markup: getAdminKeyboard(),
        },
      );
    } else {
      throw error;
    }
  }
});

// Upload winners - kategoriyalar buttonlarini ko'rsatish
bot.callbackQuery(CallbackActions.ADMIN_UPLOAD_WINNERS, async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  const session = getAdminSession(ctx.from.id);
  session.mode = 'upload_winners';
  session.selectedMonth = null;

  const tierKeyboard = new InlineKeyboard()
    .text('💎 Premium', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_premium`)
    .row()
    .text('⭐ Standard', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_standard`)
    .row()
    .text('💰 Economy', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_economy`)
    .row()
    .text('🎁 Symbolic', `${CallbackActions.ADMIN_UPLOAD_WINNERS}_symbolic`)
    .row()
    .text('⬅️ Orqaga', CallbackActions.ADMIN_UPLOAD_CODES);

  await ctx.answerCallbackQuery('✅ G\'olib kodlar kiritish rejimi');
  
  try {
    await ctx.editMessageText(
      '🎁 <b>G\'olib kodlarni kiritish</b>\n\nQaysi kategoriyaga tegishli kodlarni yuklamoqchisiz?',
      { 
        parse_mode: 'HTML',
        reply_markup: tierKeyboard,
      },
    );
  } catch (error: any) {
    if (error.error_code === 400 && error.description?.includes('not modified')) {
      await ctx.reply(
        '🎁 <b>G\'olib kodlarni kiritish</b>\n\nQaysi kategoriyaga tegishli kodlarni yuklamoqchisiz?',
        { 
          parse_mode: 'HTML',
          reply_markup: tierKeyboard,
        },
      );
    } else {
      throw error;
    }
  }
});

// Har bir kategoriya uchun alohida handler
['premium', 'standard', 'economy', 'symbolic'].forEach((tier) => {
  bot.callbackQuery(new RegExp(`^${CallbackActions.ADMIN_UPLOAD_WINNERS}_${tier}$`), async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
    }

    const session = getAdminSession(ctx.from.id);
    session.mode = 'upload_winners';
    session.winnerTier = tier as any;
    session.selectedMonth = null;

    const tierNames: Record<string, string> = {
      premium: '💎 Premium',
      standard: '⭐ Standard',
      economy: '💰 Economy',
      symbolic: '🎁 Symbolic',
    };

    await ctx.answerCallbackQuery(`✅ ${tierNames[tier]} kategoriyasi tanlandi`);
    
    const monthKeyboard = getMonthKeyboard(`admin_upload_winners_${tier}_month`);
    
    try {
      await ctx.editMessageText(
        `${tierNames[tier]} <b>kategoriyasi uchun g'olib kodlarni kiritish</b>\n\nAvval qaysi oy uchun kodlar kiritmoqchisiz?`,
        { 
          parse_mode: 'HTML',
          reply_markup: monthKeyboard,
        },
      );
    } catch (error: any) {
      if (error.error_code === 400 && error.description?.includes('not modified')) {
        await ctx.reply(
          `${tierNames[tier]} <b>kategoriyasi uchun g'olib kodlarni kiritish</b>\n\nAvval qaysi oy uchun kodlar kiritmoqchisiz?`,
          { 
            parse_mode: 'HTML',
            reply_markup: monthKeyboard,
          },
        );
      } else {
        throw error;
      }
    }
  });

  // Har bir kategoriya uchun oy tanlash handler
  bot.callbackQuery(new RegExp(`^admin_upload_winners_${tier}_month_(.+)$`), async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
    }

    const match = ctx.callbackQuery.data.match(new RegExp(`^admin_upload_winners_${tier}_month_(.+)$`));
    if (!match) return;

    const month = match[1];
    const session = getAdminSession(ctx.from.id);
    session.mode = 'upload_winners';
    session.winnerTier = tier as any;
    session.selectedMonth = month;

    const tierNames: Record<string, string> = {
      premium: '💎 Premium',
      standard: '⭐ Standard',
      economy: '💰 Economy',
      symbolic: '🎁 Symbolic',
    };

    const monthLabel = months.find(m => m.value === month)?.label || month;

    await ctx.answerCallbackQuery(`✅ ${monthLabel} tanlandi`);
    
    try {
      await ctx.editMessageText(
        `${tierNames[tier]} <b>kategoriyasi uchun g'olib kodlarni kiritish - ${monthLabel}</b>\n\nExcel/CSV/TXT fayl yuboring.\nFayl yuborilgach, ${tierNames[tier]} kategoriyasidagi g'olib kodlar avtomatik ravishda bazaga saqlanadi.`,
        { 
          parse_mode: 'HTML',
          reply_markup: getAdminKeyboard(),
        },
      );
    } catch (error: any) {
      if (error.error_code === 400 && error.description?.includes('not modified')) {
        await ctx.reply(
          `${tierNames[tier]} <b>kategoriyasi uchun g'olib kodlarni kiritish - ${monthLabel}</b>\n\nExcel/CSV/TXT fayl yuboring.\nFayl yuborilgach, ${tierNames[tier]} kategoriyasidagi g'olib kodlar avtomatik ravishda bazaga saqlanadi.`,
          { 
            parse_mode: 'HTML',
            reply_markup: getAdminKeyboard(),
          },
        );
      } else {
        throw error;
      }
    }
  });
});

// Clear codes
bot.callbackQuery(CallbackActions.ADMIN_CLEAR_CODES, async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  await ctx.answerCallbackQuery();

  const confirmKeyboard = new InlineKeyboard()
    .text('✅ Ha, o\'chirish', `${CallbackActions.ADMIN_CLEAR_CODES}_confirm`)
    .row()
    .text('❌ Bekor qilish', CallbackActions.ADMIN_UPLOAD_CODES);

  await ctx.editMessageText(
    '⚠️ <b>Ehtiyot bo\'ling!</b>\n\nBarcha kodlarni o\'chirishni tasdiqlaysizmi?',
    { 
      parse_mode: 'HTML',
      reply_markup: confirmKeyboard,
    },
  );
});

bot.callbackQuery(new RegExp(`^${CallbackActions.ADMIN_CLEAR_CODES}_confirm$`), async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  await ctx.answerCallbackQuery();

  try {
    const codeRepository = AppDataSource.getRepository(Code);
    const count = await codeRepository.count({ where: { deletedAt: IsNull() } as any });
    // Hard delete - bazadan to'liq o'chirish
    await codeRepository.delete({ deletedAt: IsNull() } as any);

    await ctx.editMessageText(
      `✅ <b>Kodlar tozalandi!</b>\n\nO'chirilgan kodlar soni: <b>${count}</b>`,
      { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      },
    );
  } catch (error: any) {
    await ctx.editMessageText(
      `❌ Xato: ${error.message}`,
      { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      },
    );
  }
});

// Clear winners
bot.callbackQuery(CallbackActions.ADMIN_CLEAR_WINNERS, async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  await ctx.answerCallbackQuery();

  const confirmKeyboard = new InlineKeyboard()
    .text('✅ Ha, o\'chirish', `${CallbackActions.ADMIN_CLEAR_WINNERS}_confirm`)
    .row()
    .text('❌ Bekor qilish', CallbackActions.ADMIN_UPLOAD_WINNERS);

  await ctx.editMessageText(
    '⚠️ <b>Ehtiyot bo\'ling!</b>\n\nBarcha g\'olib kodlarni o\'chirishni tasdiqlaysizmi?',
    { 
      parse_mode: 'HTML',
      reply_markup: confirmKeyboard,
    },
  );
});

bot.callbackQuery(new RegExp(`^${CallbackActions.ADMIN_CLEAR_WINNERS}_confirm$`), async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  await ctx.answerCallbackQuery();

  try {
    const winnerRepository = AppDataSource.getRepository(Winner);
    
    const winnerCount = await winnerRepository.count({ where: { deletedAt: IsNull() } as any });
    
    // Hard delete - g'oliblarni bazadan to'liq o'chirish
    await winnerRepository.delete({ deletedAt: IsNull() } as any);

    await ctx.editMessageText(
      `✅ <b>G'olib kodlar tozalandi!</b>\n\nO'chirilgan g'olib kodlar soni: <b>${winnerCount}</b>`,
      { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      },
    );
  } catch (error: any) {
    await ctx.editMessageText(
      `❌ Xato: ${error.message}`,
      { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      },
    );
  }
});

// Upload images
bot.callbackQuery(CallbackActions.ADMIN_UPLOAD_IMAGES, async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  const session = getAdminSession(ctx.from.id);
  session.mode = 'upload_images';

  const imageKeyboard = new InlineKeyboard()
    .text('💎 Premium', `${CallbackActions.ADMIN_UPLOAD_IMAGES}_premium`)
    .row()
    .text('⭐ Standard', `${CallbackActions.ADMIN_UPLOAD_IMAGES}_standard`)
    .row()
    .text('💰 Economy', `${CallbackActions.ADMIN_UPLOAD_IMAGES}_economy`)
    .row()
    .text('🎁 Symbolic', `${CallbackActions.ADMIN_UPLOAD_IMAGES}_symbolic`)
    .row()
    .text('⬅️ Orqaga', CallbackActions.ADMIN_UPLOAD_CODES);

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    '🖼️ <b>Rasmlarni yuklash</b>\n\nQaysi turdagi sovg\'a uchun rasm yuklamoqchisiz?',
    { 
      parse_mode: 'HTML',
      reply_markup: imageKeyboard,
    },
  );
});

// Image type selection
['premium', 'standard', 'economy', 'symbolic'].forEach((type) => {
  bot.callbackQuery(new RegExp(`^${CallbackActions.ADMIN_UPLOAD_IMAGES}_${type}$`), async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
    }

    const session = getAdminSession(ctx.from.id);
    session.imageType = type as any;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `🖼️ <b>${type.toUpperCase()} rasm yuklash</b>\n\nRasm yuboring (foto yoki sticker).`,
      { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      },
    );
  });
});

// Oddiy kodlarni ko'rish - jami nechtaligini
bot.callbackQuery(CallbackActions.ADMIN_VIEW_CODES, async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  const codeRepository = AppDataSource.getRepository(Code);
  
  const total = await codeRepository.count({
    where: { deletedAt: IsNull() } as any,
  });

  const used = await codeRepository.count({
    where: { isUsed: true, deletedAt: IsNull() } as any,
  });

  const unused = total - used;

  await ctx.answerCallbackQuery();
  
  try {
    await ctx.editMessageText(
      `📊 <b>Oddiy kodlar statistikasi</b>\n\n` +
      `📦 Jami kodlar: <b>${total}</b>\n` +
      `✅ Ishlatilgan: <b>${used}</b>\n` +
      `⏳ Ishlatilmagan: <b>${unused}</b>`,
      { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      },
    );
  } catch (error: any) {
    if (error.error_code === 400 && error.description?.includes('not modified')) {
      await ctx.reply(
        `📊 <b>Oddiy kodlar statistikasi</b>\n\n` +
        `📦 Jami kodlar: <b>${total}</b>\n` +
        `✅ Ishlatilgan: <b>${used}</b>\n` +
        `⏳ Ishlatilmagan: <b>${unused}</b>`,
        { 
          parse_mode: 'HTML',
          reply_markup: getAdminKeyboard(),
        },
      );
    } else {
      throw error;
    }
  }
});

// G'olib kodlarni kategoriyasiga qarab ko'rish
bot.callbackQuery(CallbackActions.ADMIN_VIEW_WINNERS, async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.answerCallbackQuery('❌ Siz admin emassiz.');
  }

  const winnerRepository = AppDataSource.getRepository(Winner);
  
  const tiers = ['premium', 'standard', 'economy', 'symbolic'] as const;
  const tierLabels: Record<string, string> = {
    premium: '💎 Premium',
    standard: '⭐ Standard',
    economy: '💰 Economy',
    symbolic: '🎁 Symbolic',
  };

  let statsText = `📈 <b>G'olib kodlar statistikasi</b>\n\n`;

  let totalWinners = 0;
  let totalUsed = 0;

  for (const tier of tiers) {
    const total = await winnerRepository.count({
      where: { tier, deletedAt: IsNull() } as any,
    });

    const used = await winnerRepository.count({
      where: { tier, isUsed: true, deletedAt: IsNull() } as any,
    });

    const unused = total - used;
    totalWinners += total;
    totalUsed += used;

    statsText += `${tierLabels[tier]}\n`;
    statsText += `  📦 Jami: <b>${total}</b>\n`;
    statsText += `  ✅ Ishlatilgan: <b>${used}</b>\n`;
    statsText += `  ⏳ Ishlatilmagan: <b>${unused}</b>\n\n`;
  }

  statsText += `━━━━━━━━━━━━━━━━\n`;
  statsText += `📊 <b>Umumiy:</b>\n`;
  statsText += `📦 Jami: <b>${totalWinners}</b>\n`;
  statsText += `✅ Ishlatilgan: <b>${totalUsed}</b>\n`;
  statsText += `⏳ Ishlatilmagan: <b>${totalWinners - totalUsed}</b>`;

  await ctx.answerCallbackQuery();
  
  try {
    await ctx.editMessageText(statsText, { 
      parse_mode: 'HTML',
      reply_markup: getAdminKeyboard(),
    });
  } catch (error: any) {
    if (error.error_code === 400 && error.description?.includes('not modified')) {
      await ctx.reply(statsText, { 
        parse_mode: 'HTML',
        reply_markup: getAdminKeyboard(),
      });
    } else {
      throw error;
    }
  }
});

export { getAdminSession };

