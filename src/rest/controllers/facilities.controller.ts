import { Request, Response, NextFunction } from 'express';
import { facilityService } from '../../core/services/facility.service';
import { validate, slotAvailabilitySchema } from '../../core/validators/booking.validator';

export class FacilitiesController {
  async getAllFacilities(
    _req: Request,
    res: Response,
    next: NextFunction): Promise<void> {
    try {
      const facilities = await facilityService.getAllFacilities();
      res.status(200).json(facilities);
    } catch (error) {
      next(error);
    }
  }

  async getFacilityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const facility = await facilityService.getFacilityById(id);
      res.status(200).json(facility);
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facilityId = parseInt(req.params.id);
      const date = req.query.date as string;

      if (!date) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Date query parameter is required',
          code: 'MISSING_PARAMETER'
        });
        return;
      }

      const params = validate(slotAvailabilitySchema, {
        facilityId,
        date
      });

      const slots = await facilityService.getAvailableSlots(params);

      res.status(200).json({
        facilityId,
        date: params.date,
        slots
      });
    } catch (error) {
      next(error);
    }
  }
}

export const facilitiesController = new FacilitiesController();