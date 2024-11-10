export interface FileMetadata {
  filename: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface IFileStorage {
  save(file: Express.Multer.File): Promise<FileMetadata>;
  delete(filename: string): Promise<void>;
  getPath(filename: string): string;
}