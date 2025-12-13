import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { dashboardGiftCodesController } from './controller';
import { userController } from '../../users/controller';
import { UserRole } from '../../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const dashboardGiftCodesRouter = Router().get(
  '/codes',
  userController.authorizeUser,
  requireAdmin,
  runAsyncWrapper(dashboardGiftCodesController.getGiftCodes),
);

export { dashboardGiftCodesRouter };





