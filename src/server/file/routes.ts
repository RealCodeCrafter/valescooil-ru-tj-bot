import { Router } from 'express';
import { fileController } from './controller';
import multer from 'multer';
import { runAsyncWrapper } from '../../common/utility/run-async-wrapper';
import { userController } from '../users/controller';
import { UserRole } from '../../db/entities/user.entity';

const requireAdmin = userController.authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

const filesRouter = Router()
  .post('/:type', userController.authorizeUser, requireAdmin, multer().single('file'), runAsyncWrapper(fileController.upload))
  .get('/:bucketName/:id', userController.authorizeUser, requireAdmin, runAsyncWrapper(fileController.get));

export { filesRouter };
