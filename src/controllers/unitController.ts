import {
    HTTP_STATUS_BAD_REQUEST,
    HTTP_STATUS_CREATED,
    HTTP_STATUS_INTERNAL_SERVER_ERROR,
    HTTP_STATUS_NO_CONTENT,
    HTTP_STATUS_OK,
    HTTP_STATUS_NOT_FOUND,
} from '@constants/constants';
import UnitService from '@services/unitService';
import { logger } from '@services/logService';
import { Request, Response } from 'express';
import Zod, { ZodError } from 'zod';
import { unitSchema, updateUnitSchema } from '@utils/validations/unit.schema';

export class UnitController {
    private unitService: UnitService;

    constructor(unitService: UnitService) {
        this.unitService = unitService;
    }

    public create = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, description, classroomId, educationalContents } = req.body;
            logger.info('[UnitController] Validating unit creation request');
            unitSchema.parse({ name, description, classroomId });

            logger.info('[UnitController] Creating unit');
            const result = await this.unitService.create({ name, description, classroomId, educationalContents });
            logger.info('[UnitController] Unit created successfully');
            res.status(HTTP_STATUS_CREATED).json(result);
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessage = error.errors.map((e) => e.message).join(', ');
                logger.warn(`[UnitController] Validation error: ${errorMessage}`);
                res.status(HTTP_STATUS_BAD_REQUEST).json({ message: errorMessage });
            } else {
                logger.error('[UnitController] Error creating unit:', error);
                res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
            }
        }
    };

    public get = async (req: Request, res: Response): Promise<void> => {
        try {
            const { unitId } = req.params;
            logger.info('[UnitController] Fetching all units');
            const units = await this.unitService.get(unitId);
            res.status(HTTP_STATUS_OK).json(units);
        } catch (error) {
            logger.error('[UnitController] Error fetching units:', error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch units' });
        }
    };


    public async getAll(req: Request, res: Response): Promise<void> {
        try {
            const filters = req.body.filter || {};
            logger.info('[UnitController] Received filters for unit search (GET body):', filters);

            const units = await this.unitService.getAll(filters);
            res.status(HTTP_STATUS_OK).json(units);
        } catch (error) {
            logger.error('[UnitController] Error filtering units:', error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to filter units' });
        }
    }




    public update = async (req: Request, res: Response): Promise<void> => {
        const { unitId } = req.params;
        const updateFields = req.body;
        try {
            const validatedFields = updateUnitSchema.parse(updateFields);
            logger.info(`[UnitController] Updating unit ID=${unitId}`);
            const result = await this.unitService.update(unitId, validatedFields);

            logger.info(`[UnitController] Unit ID=${unitId} updated successfully`);
            res.status(HTTP_STATUS_OK).json(result);
        } catch (error) {
            if (error instanceof Zod.ZodError) {
                logger.warn(
                    `[UnitController] Validation failed for unit update ID=${unitId}: ${error.errors
                        .map((e) => e.message)
                        .join(', ')}`
                );
                res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Validation error', details: error.errors });
            } else {
                logger.error(`[UnitController] Error updating unit ID=${unitId}:`, error);
                res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
            }
        }
    };

    public delete = async (req: Request, res: Response): Promise<void> => {
        const { unitId } = req.params;

        try {
            logger.info(`[UnitController] Checking if unit ID=${unitId} exists`);
            const existingUnit = await this.unitService.get(unitId);

            if (!existingUnit) {
                logger.warn(`[UnitController] Unit ID=${unitId} not found`);
                res.status(HTTP_STATUS_NOT_FOUND).json({ error: 'Unit not found' });
                return;
            }

            logger.info(`[UnitController] Deleting unit ID=${unitId}`);
            await this.unitService.delete(unitId);

            logger.info(`[UnitController] Unit ID=${unitId} deleted successfully`);
            res.status(HTTP_STATUS_NO_CONTENT).send({ message: `Unit with ID=${unitId} deleted successfully` });
        } catch (error) {
            logger.error(`[UnitController] Error deleting unit ID=${unitId}:`, error);
            res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete unit' });
        }
    };
}
