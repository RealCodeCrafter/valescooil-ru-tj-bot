import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { dashboardCodesController } from './controller';
import { userController } from '../../users/controller';
import { UserRole } from '../../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const dashboardCodesRouter = Router()
  .get('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(dashboardCodesController.getCodes))
  .get('/search', userController.authorizeUser, requireAdmin, runAsyncWrapper(dashboardCodesController.search));

export { dashboardCodesRouter };


