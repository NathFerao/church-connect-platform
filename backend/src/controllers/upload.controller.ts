
import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/helpers';
import { BadRequestError } from '../utils/errors';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export class UploadController {
  /**
   * WHY: Church admins need to upload logos
   * WHAT: Saves uploaded file, returns public URL
   * HOW: 
   *   1. File comes in as req.file (from multer)
   *   2. Generate unique filename
   *   3. Save to uploads folder
   *   4. Return public URL
   */
  uploadLogo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
      await mkdir(uploadsDir, { recursive: true });

      // Generate filename: churchId-timestamp.ext
      const ext = path.extname(req.file.originalname);
      const filename = `${req.churchId}-${Date.now()}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file
      await writeFile(filepath, req.file.buffer);

      // Return public URL
      // In production, this would be a CDN URL
      const url = `/uploads/logos/${filename}`;

      res.json(successResponse({ url }, 'Logo uploaded successfully'));
    } catch (error) {
      next(error);
    }
  };
}
