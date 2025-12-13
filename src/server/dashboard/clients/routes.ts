import { Router } from 'express';
import { runAsyncWrapper } from '../../../common/utility/run-async-wrapper';
import { dashboardClientController } from './controller';
import { userController } from '../../users/controller';
import { UserRole } from '../../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const clientsRouter = Router().get('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(dashboardClientController.getClients));

export { clientsRouter };





