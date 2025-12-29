import { Router } from 'express';
import { shareController } from '../controllers/share.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/files/:id/share', authenticate, shareController.shareWithUser.bind(shareController));

router.get('/files/:id/share', authenticate, shareController.getShareInfo.bind(shareController));

router.post('/files/:id/share-link', authenticate, shareController.createShareLink.bind(shareController));

router.delete('/files/:id/share/:userId', authenticate, shareController.revokeShareAccess.bind(shareController));

router.delete('/files/:id/share-link', authenticate, shareController.removeShareLink.bind(shareController));

router.get('/files/shared', authenticate, shareController.getSharedFiles.bind(shareController));

router.get('/files/shared/:token/download', shareController.downloadSharedFile.bind(shareController));

router.get('/files/shared/:token', shareController.getFileByShareToken.bind(shareController));

export default router;
