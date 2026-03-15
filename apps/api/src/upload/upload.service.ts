import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { Response, Request } from 'express';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadService {
  private logger = new Logger(UploadService.name);
  private uploadDir: string;
  private baseUrl: string;

  // S3 fields (only set when STORAGE_PROVIDER=s3)
  private s3: S3Client | null = null;
  private bucket: string | null = null;
  private cloudfrontUrl: string | null = null;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:3000';

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    if (this.isS3Mode()) {
      this.s3 = new S3Client({
        region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: this.configService.get<string>(
            'AWS_ACCESS_KEY_ID',
          ) as string,
          secretAccessKey: this.configService.get<string>(
            'AWS_SECRET_ACCESS_KEY',
          ) as string,
        },
      });
      this.bucket = this.configService.get<string>('AWS_S3_BUCKET') as string;
      this.cloudfrontUrl =
        this.configService.get<string>('AWS_CLOUDFRONT_URL') || null;
      this.logger.log(`Storage mode: AWS S3 (bucket: ${this.bucket})`);
    } else {
      this.logger.log('Storage mode: Local filesystem');
    }
  }

  // ─── Mode check ─────────────────────────────────────────────────────────────

  isS3Mode(): boolean {
    return this.configService.get<string>('STORAGE_PROVIDER') === 's3';
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  private allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/quicktime',
    'video/x-matroska',
  ];
  private maxFileSizeBytes = 500 * 1024 * 1024; // 500MB

  validateVideoFile(file: Express.Multer.File): void {
    if (!this.allowedVideoTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: mp4, webm, ogg, avi, mov, mkv',
      );
    }
    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException('File size exceeds 500MB limit');
    }
  }

  // ─── Save temp file (always local — used for Gemini video analysis) ──────────

  saveTempFile(file: Express.Multer.File): { filePath: string; mimeType: string } {
    const ext = path.extname(file.originalname);
    const fileName = `${randomUUID()}${ext}`;
    const tempDir = path.join(this.uploadDir, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return { filePath, mimeType: file.mimetype };
  }

  // ─── Upload video (local or S3 based on STORAGE_PROVIDER) ───────────────────

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'lessons',
  ): Promise<{
    blobFileName: string;
    fileUrl: string;
    filePath: string;
    fileSize: bigint;
    fileType: string;
  }> {
    this.validateVideoFile(file);

    const ext = path.extname(file.originalname);
    const fileName = `${randomUUID()}${ext}`;
    const blobFileName = `${folder}/${fileName}`;

    if (this.isS3Mode()) {
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: this.bucket!,
          Key: blobFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const fileUrl = this.cloudfrontUrl
        ? `${this.cloudfrontUrl}/${blobFileName}`
        : `https://${this.bucket}.s3.amazonaws.com/${blobFileName}`;

      this.logger.log(`Video uploaded to S3: ${blobFileName}`);

      return {
        blobFileName,
        fileUrl,
        filePath: '', // not applicable for S3
        fileSize: BigInt(file.size),
        fileType: file.mimetype,
      };
    } else {
      const subDir = path.join(this.uploadDir, folder);
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
      const localPath = path.join(subDir, fileName);
      fs.writeFileSync(localPath, file.buffer);
      const fileUrl = `${this.baseUrl}/uploads/${folder}/${fileName}`;
      this.logger.log(`Video saved locally: ${localPath}`);

      return {
        blobFileName,
        fileUrl,
        filePath: localPath,
        fileSize: BigInt(file.size),
        fileType: file.mimetype,
      };
    }
  }

  // ─── Delete video ────────────────────────────────────────────────────────────

  async deleteVideo(blobFileName: string): Promise<void> {
    if (this.isS3Mode()) {
      await this.s3!.send(
        new DeleteObjectCommand({ Bucket: this.bucket!, Key: blobFileName }),
      );
      this.logger.log(`Deleted from S3: ${blobFileName}`);
    } else {
      const localPath = path.join(this.uploadDir, blobFileName);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        this.logger.log(`Deleted local file: ${localPath}`);
      }
    }
  }

  // ─── Generate presigned URL (S3 only) ────────────────────────────────────────

  async getPresignedUrl(
    blobFileName: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!this.isS3Mode() || !this.s3) return '';
    const command = new GetObjectCommand({
      Bucket: this.bucket!,
      Key: blobFileName,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  // ─── Stream video (local only) ───────────────────────────────────────────────

  streamVideo(filePath: string, req: Request, res: Response): void {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Video file not found on disk');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.webm' ? 'video/webm' : 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  }

  resolveLocalPath(blobFileName: string): string {
    return path.join(this.uploadDir, blobFileName);
  }

  // ─── Upload document (PDF, DOCX, images, etc.) ───────────────────────────────

  private maxDocSizeBytes = 50 * 1024 * 1024; // 50MB
  private allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
  ];

  validateDocumentFile(file: Express.Multer.File): void {
    if (!this.allowedDocTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: PDF, Word, PowerPoint, Excel, images, text',
      );
    }
    if (file.size > this.maxDocSizeBytes) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: string = 'course-notes',
  ): Promise<{
    blobFileName: string;
    fileUrl: string;
    fileSize: bigint;
    fileType: string;
    originalName: string;
  }> {
    this.validateDocumentFile(file);

    const ext = path.extname(file.originalname);
    const fileName = `${randomUUID()}${ext}`;
    const blobFileName = `${folder}/${fileName}`;

    if (this.isS3Mode()) {
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: this.bucket!,
          Key: blobFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const fileUrl = this.cloudfrontUrl
        ? `${this.cloudfrontUrl}/${blobFileName}`
        : `https://${this.bucket}.s3.amazonaws.com/${blobFileName}`;
      return { blobFileName, fileUrl, fileSize: BigInt(file.size), fileType: file.mimetype, originalName: file.originalname };
    } else {
      const subDir = path.join(this.uploadDir, folder);
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
      const localPath = path.join(subDir, fileName);
      fs.writeFileSync(localPath, file.buffer);
      const fileUrl = `${this.baseUrl}/uploads/${folder}/${fileName}`;
      return { blobFileName, fileUrl, fileSize: BigInt(file.size), fileType: file.mimetype, originalName: file.originalname };
    }
  }
}
