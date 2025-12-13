import { Router } from 'express';
import { runAsyncWrapper } from '../../common/utility/run-async-wrapper';
import { codesController } from './controller';
import { userController } from '../users/controller';
import { UserRole } from '../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const codesRouter = Router()
  // Barcha kodlar
  .get('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getAll))
  .get('/usedByUser/:usedById', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getUsedBy))
  .patch('/gift-give/:_id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.codeGiftGive))
  .patch('/reset-usage/:_id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.resetCodeUsage))
  .patch('/reset-usage-by-value', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.resetCodeUsageByValue))
  .patch('/winners/reset-usage/:_id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.resetWinnerCodeUsage))
  .patch('/winners/reset-usage-by-value', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.resetWinnerCodeUsageByValue))
  // G'oliblar (winners.json dagi kodlar bilan ishlatilgan)
  .get('/winners/all', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getWinners))
  .get('/winners/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getWinnerById))
  // Mag'lublar (winners.json da yo'q, lekin ishlatilgan)
  .get('/losers/all', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getLosers))
  .get('/losers/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getLoserById))
  // Winner kodlar (winners.json dagi kodlar)
  .get('/winner-codes/all', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getWinnerCodes))
  .get('/winner-codes/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getWinnerCodeById))
  // Yutuqsiz kodlar (bazada bor, lekin winners.json da yo'q)
  .get('/non-winner-codes/all', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getNonWinnerCodes))
  .get('/non-winner-codes/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getNonWinnerCodeById))
  // Yangi API: Kod kiritib GET qilganda qaysi oyga tegishli ekanligini qaytaradi
  .get('/code-month', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getCodeMonth))
  // Yangi API: Oy tanlansa shu oyga tegishli kodlar chiqadi
  .get('/by-month/:month', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getCodesByMonth))
  // Yangi API: Oy va yil tanlansa shu oy va yilga tegishli kodlar chiqadi
  .get('/by-month-year/:month/:year', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getCodesByMonthAndYear))
  // Oxirgi route - barcha boshqa routelardan keyin
  .get('/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(codesController.getById));

export { codesRouter };
