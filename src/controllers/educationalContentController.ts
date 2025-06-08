import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  VALID_CONTENT_TYPES,
} from '@constants/constants';
import unitDAO from '@dao/unitDAO';
import educationalContentService from '@services/educationalContentService';
import { logger } from '@services/logService';
import unitService from '@services/unitService';
import { uploadFileToCloudinary } from '@utils/uploadFile';
import { educationalContentSchema } from '@utils/validations/educationalContent.schema';
import { Request, Response } from 'express';
import fs from 'fs';

export class EducationalContentController {
  async create(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;
    logger.info(`[EducationalContentController] Received request to create educational content │ unitId=${unitId}`);

    // Validate request body (only 'type' and 'content' as string)
    const validationResult = educationalContentSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;

      // If type is DOCUMENT, skip content validation error since content comes from req.file
      const type = req.body.type;
      if (
        type === 'DOCUMENT' &&
        errors.content &&
        errors.content.some((msg) => msg.includes('Invalid input') || msg.includes('Required'))
      ) {
        logger.info(`[EducationalContentController] Skipping content validation errors for DOCUMENT type`);
        delete errors.content;
      }

      if (Object.keys(errors).length > 0) {
        logger.warn(`[EducationalContentController] Validation failed │ errors=${JSON.stringify(errors)}`);
        res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Validation failed', details: errors });
        return;
      }
    }

    // Use parsed data if validation succeeded, else fallback to raw req.body
    let { type, content } = validationResult.success ? validationResult.data : req.body;

    logger.info(
      `[EducationalContentController] Creating content │ unitId=${unitId} │ type=${type} │ rawContent=${JSON.stringify(
        content
      )}`
    );

    if (!VALID_CONTENT_TYPES.includes(type)) {
      logger.warn(
        `[EducationalContentController] Invalid content type │ type=${type} │ validTypes=${VALID_CONTENT_TYPES.join(
          ', '
        )}`
      );
      res.status(HTTP_STATUS_BAD_REQUEST).json({
        error: `Type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`,
      });
      return;
    }

    try {
      const unit = await unitDAO.get(unitId);
      if (!unit) {
        logger.warn(`[EducationalContentController] Unit not found │ unitId=${unitId}`);
        res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
        return;
      }

      if (type === 'DOCUMENT') {
        const file = req.file;
        if (!file) {
          logger.warn(`[EducationalContentController] Document type requires file upload but no file received.`);
          res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'No document file uploaded' });
          return;
        }

        logger.info(
          `[EducationalContentController] File upload detected │ name=${file.originalname} │ mimeType=${file.mimetype} │ size=${file.size} bytes`
        );

        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/msword',
          'application/vnd.ms-powerpoint',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          logger.warn(
            `[EducationalContentController] Unsupported file type │ mimeType=${
              file.mimetype
            } │ allowed=${allowedMimeTypes.join(', ')}`
          );
          fs.unlinkSync(file.path);
          res.status(HTTP_STATUS_BAD_REQUEST).json({
            error: 'Unsupported file type. Only PDF, DOCX, and PPTX are allowed.',
          });
          return;
        }

        logger.info(`[EducationalContentController] Uploading file to Cloudinary...`);
        const uploadResult = await uploadFileToCloudinary(file.path, 'pdf');
        logger.info(`[EducationalContentController] File uploaded to Cloudinary │ url=${uploadResult.url}`);
        content = uploadResult.url; // Replace content with uploaded file URL
      } else {
        if (!content || typeof content !== 'string' || content.trim() === '') {
          logger.warn(`[EducationalContentController] Empty content provided for type=${type}`);
          res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Content must be a non-empty string' });
          return;
        }
      }

      const createdContent = await educationalContentService.create(unitId, { content, type });
      logger.info(
        `[EducationalContentController] Successfully created content │ id=${createdContent.id} │ type=${type}`
      );

      res.status(HTTP_STATUS_CREATED).json(createdContent);
    } catch (error) {
      logger.error('[EducationalContentController] Error creating educational content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to create educational content' });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params;

    logger.info(`[EducationalContentController] Fetching contents for unitId: ${unitId}`);
    try {
      const educationalContents = await educationalContentService.get(unitId);
      logger.info(
        `[EducationalContentController] Retrieved ${educationalContents.length} content item(s) for unitId: ${unitId}`
      );
      res.status(HTTP_STATUS_OK).json(educationalContents);
    } catch (error) {
      logger.error('[EducationalContentController] Error fetching contents:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch educational content' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    logger.info('[EducationalContentController] Fetching all educational contents with filters');
    try {
      const filters = req.body.filter || {};
      const educationalContents = await educationalContentService.getAll(filters);
      logger.info(`[EducationalContentController] Retrieved ${educationalContents.length} content item(s)`);
      res.status(HTTP_STATUS_OK).json(educationalContents);
    } catch (error) {
      logger.error('[EducationalContentController] Error fetching all educational contents:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch educational contents' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { educationalContentId } = req.params;
    const updateEducationalContent = req.body;

    if (!educationalContentId) {
      logger.warn(`[EducationalContentController] Invalid educationalContentId: ${educationalContentId}`);
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid educationalContentId' });
      return;
    }

    const validation = educationalContentSchema.safeParse(updateEducationalContent);
    if (!validation.success) {
      logger.warn(`[EducationalContentController] Validation failed: ${JSON.stringify(validation.error.issues)}`);
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid update data', details: validation.error.issues });
      return;
    }

    logger.info(
      `[EducationalContentController] Updating content with ID: ${educationalContentId} using data: ${JSON.stringify(
        updateEducationalContent
      )}`
    );
    try {
      const updatedContent = await educationalContentService.update(educationalContentId, updateEducationalContent);
      logger.info(`[EducationalContentController] Successfully updated content with ID: ${updatedContent.id}`);
      res.status(HTTP_STATUS_OK).json(updatedContent);
    } catch (error) {
      logger.error('[EducationalContentController] Error updating content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to update educational content' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { educationalContentId } = req.params;

    logger.info(`[EducationalContentController] Deleting content with ID: ${educationalContentId}`);
    try {
      await educationalContentService.delete(educationalContentId);
      logger.info(`[EducationalContentController] Successfully deleted content with ID: ${educationalContentId}`);
      res.status(HTTP_STATUS_NO_CONTENT).send();
    } catch (error) {
      logger.error('[EducationalContentController] Error deleting content:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete educational content' });
    }
  }
}
