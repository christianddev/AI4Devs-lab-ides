import { IFileStorage, FileMetadata } from '../interfaces/file-storage.interface';
import { AppError } from '../utils/error';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class LocalFileStorage implements IFileStorage {
  private uploadPath: string;

  constructor() {
    this.uploadPath = process.env.FILE_UPLOAD_PATH || 'uploads';
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async save(file: Express.Multer.File): Promise<FileMetadata> {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    const fileExtension = path.extname(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, filename);

    await fs.writeFile(filePath, file.buffer);

    return {
      filename,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
    };
  }

  async delete(filename: string): Promise<void> {
    const filePath = this.getPath(filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getPath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }
}