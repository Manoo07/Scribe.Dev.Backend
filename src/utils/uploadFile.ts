import cloudinary from '../config/cloudinary';
import fs from 'fs';
import { logger } from '@services/logService'; // Make sure this import is correct based on your project structure

/**
 * Uploads a file to Cloudinary and deletes the local file after successful upload.
 * @param filePath Path to the local file to upload
 * @param fileType File type for determining Cloudinary resource type
 * @returns Cloudinary URL and public ID
 */
export const uploadFileToCloudinary = async (
  filePath: string,
  fileType: 'pdf' | 'ppt' | 'docx' | 'other' = 'other'
): Promise<{ url: string; public_id: string }> => {
  try {
    const resourceType = fileType === 'pdf' ? 'raw' : 'auto';

    logger.info(
      `[CloudinaryService] Starting upload │ filePath=${filePath} │ fileType=${fileType} │ resourceType=${resourceType}`
    );

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder: 'scribe',
    });

    logger.info(
      `[CloudinaryService] Upload successful │ url=${result.secure_url} │ public_id=${result.public_id} │ size=${result.bytes} bytes`
    );

    fs.unlinkSync(filePath);
    logger.info(`[CloudinaryService] Local file deleted │ filePath=${filePath}`);

    return { url: result.secure_url, public_id: result.public_id };
  } catch (error: any) {
    logger.error(`[CloudinaryService] Upload failed │ filePath=${filePath} │ error=${error.message}`);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};
