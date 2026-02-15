
import multer from 'multer';
import { Request } from 'express';
import { BadRequestError } from '../utils/errors';

// Configure multer - stores file in memory as buffer
// WHY memory? So we can upload to S3/cloud storage later
const storage = multer.memoryStorage();

// File filter - only accept images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // Accept file
  } else {
    cb(new BadRequestError('Only image files are allowed'), false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max
  }
});