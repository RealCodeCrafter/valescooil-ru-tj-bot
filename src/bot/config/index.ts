import 'dotenv/config';
import { GiftType } from '../../db/entities/gift.entity';

interface MessageI {
  start: number;
  codeFake: number;
  codeUsed: number;
  codeReal: number;
  codeWithGift: Record<GiftType, number>;
  codeUsageLimit: number;
  auth: { requestName: number };
}

export const BOT_TOKEN = process.env.BOT_TOKEN as string;
export const FORWARD_MESSAGES_CHANNEL_ID = -1002097144950;

// Admin ID lar ro'yxati
const ADMIN_IDS = [
  5661241603,  // Asosiy admin
  7546792114,  // Ikkinchi admin
];

// Admin ID ni tekshirish funksiyasi
export const isAdmin = (userId: number | undefined): boolean => {
  if (!userId) return false;
  return ADMIN_IDS.includes(Number(userId));
};

// Eski kodlar bilan moslik uchun (birinchi admin ID)
export const ADMIN_TG_ID = ADMIN_IDS[0];

export const messageIds: Record<'tj' | 'ru', MessageI> = {
  tj: {
    start: 6,
    codeWithGift: {
      premium: 59,
      // classic: 100,
      standard: 102,
      economy: 104,
      symbolic: 106,
    },
    codeReal: 52, // 52 face code
    codeFake: 8, // 8 real code
    codeUsed: 54,
    codeUsageLimit: 40,
    auth: { requestName: 56 },
  },
  ru: {
    start: 7,
    codeWithGift: {
      premium: 60,
      // classic: 101,
      standard: 103,
      economy: 105,
      symbolic: 107,
    },
    auth: { requestName: 57 },
    codeReal: 9, // 53 face code
    codeFake: 53, // 9 real code
    codeUsed: 55,
    codeUsageLimit: 41,
  },
};
