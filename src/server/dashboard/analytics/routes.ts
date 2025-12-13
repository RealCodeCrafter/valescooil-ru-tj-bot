import { Router } from 'express';
import { analyticsController } from './controller';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { userController } from '../../users/controller';
import { UserRole } from '../../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const analyticsRouter = Router().get('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(analyticsController.get));

export { analyticsRouter };
