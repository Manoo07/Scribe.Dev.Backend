import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { logger } from '@services/logService';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

interface UploadResult {
  url: string;
  public_id: string;
}

export const uploadFileToCloudinary = async (localFilePath: string, folder: string): Promise<UploadResult> => {
  try {
    logger.info(`[CLOUDINARY] Uploading file at path: ${localFilePath} to folder: ${folder}`);

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: 'auto',
    });

    logger.info(`[CLOUDINARY] File uploaded successfully │ URL=${result.secure_url}`);
    return { url: result.secure_url, public_id: result.public_id };
  } catch (error: any) {
    logger.error('[CLOUDINARY] Error uploading file:', error);
    throw new Error('Failed to upload file to Cloudinary');
  } finally {
    fs.unlinkSync(localFilePath);
  }
};
