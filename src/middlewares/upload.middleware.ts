import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { Request } from 'express';
import { env } from '../config/env';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../utils/constants';
import { sendErrorResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { Response, NextFunction } from 'express';

const uploadDir = path.resolve(env.UPLOAD_DIR || './uploads');
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || MAX_FILE_SIZE,
  },
});

export const uploadSingle = upload.single('file');

export const handleUploadError = (err: any, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendErrorResponse(res, 'File size exceeds maximum limit', HTTP_STATUS.BAD_REQUEST);
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      sendErrorResponse(res, 'Unexpected file field', HTTP_STATUS.BAD_REQUEST);
      return;
    }
    sendErrorResponse(res, err.message, HTTP_STATUS.BAD_REQUEST);
    return;
  }

  if (err.message && err.message.includes('not allowed')) {
    sendErrorResponse(res, err.message, HTTP_STATUS.BAD_REQUEST);
    return;
  }

  next(err);
};

