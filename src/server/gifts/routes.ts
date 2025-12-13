import { Router } from 'express';
import { runAsyncWrapper } from '../../common/utility/run-async-wrapper';
// import { employeeController } from '../employee/controller';
import { giftController } from './controller';
import { userController } from '../users/controller';
import { UserRole } from '../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const giftsRouter = Router()
  .post('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(giftController.create))
  .put('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(giftController.updateById))
  .get('/', userController.authorizeUser, requireAdmin, runAsyncWrapper(giftController.getAll))
  .get('/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(giftController.getById))
  .delete('/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(giftController.deleteById));

export { giftsRouter };
