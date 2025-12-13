import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { overviewController } from './controller';
import { userController } from '../../users/controller';
import { UserRole } from '../../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const overviewRouter = Router().get('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(overviewController.getSummary));

export { overviewRouter };





