import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/upload', authenticate, fileController.upload.bind(fileController));

router.post('/folder', authenticate, fileController.createFolder.bind(fileController));

router.get('/', authenticate, fileController.getFiles.bind(fileController));

router.get('/search', authenticate, fileController.searchFiles.bind(fileController));

router.get('/:id', authenticate, fileController.getFileById.bind(fileController));

router.delete('/:id', authenticate, fileController.deleteFile.bind(fileController));

router.patch('/:id/rename', authenticate, fileController.renameFile.bind(fileController));

router.get('/:id/download', authenticate, fileController.downloadFile.bind(fileController));

export default router;
