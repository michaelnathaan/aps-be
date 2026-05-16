import { Request, Response, NextFunction } from 'express';
import { facilityService } from '../../core/services/facility.service';
import { validate, slotAvailabilitySchema, createFacilitySchema, updateFacilitySchema } from '../../core/validators/booking.validator';
import path from 'path';
import sharp from 'sharp';
import fs from "fs/promises";

export class FacilitiesController {
  async getAllFacilities(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const facilities = await facilityService.getAllFacilities();

      const formatted = facilities.map((facility) => ({
        ...facility,
        imageUrl: `/uploads/facilities/${facility.id}.webp`,
      }));

      res.status(200).json(formatted);
    } catch (error) {
      next(error);
    }
  }

  async getFacilityById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      const facility = await facilityService.getFacilityById(id);

      res.status(200).json({
        ...facility,
        imageUrl: `/uploads/facilities/${facility.id}.webp`,
      });
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

  async createFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = validate(createFacilitySchema, {
        ...req.body,
        pricePerHour: Number(req.body.pricePerHour),
        isActive: req.body.isActive === "true",
      });

      const facility = await facilityService.createFacility(data);

      if (req.file) {
        const uploadDir = path.join(
          process.cwd(),
          "uploads",
          "facilities"
        );

        await fs.mkdir(uploadDir, { recursive: true });

        const outputPath = path.join(
          uploadDir,
          `${facility.id}.webp`
        );

        await sharp(req.file.buffer)
          .webp({
            quality: 80,
          })
          .resize(1200, 1200, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFile(outputPath);
      }

      res.status(201).json({
        ...facility,
        imageUrl: `/uploads/facilities/${facility.id}.webp`,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFacility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      const data = validate(updateFacilitySchema, {
        ...req.body,
        ...(req.body.pricePerHour && {
          pricePerHour: Number(req.body.pricePerHour),
        }),
        ...(req.body.isActive !== undefined && {
          isActive: req.body.isActive === "true",
        }),
      });

      const facility = await facilityService.updateFacility(id, data);

      // Replace image if uploaded
      if (req.file) {
        const uploadDir = path.join(
          process.cwd(),
          "uploads",
          "facilities"
        );

        await fs.mkdir(uploadDir, { recursive: true });

        const outputPath = path.join(
          uploadDir,
          `${facility.id}.webp`
        );

        await sharp(req.file.buffer)
          .webp({
            quality: 80,
          })
          .resize(1200, 1200, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFile(outputPath);
      }

      res.status(200).json({
        ...facility,
        imageUrl: `/uploads/facilities/${facility.id}.webp`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFacility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      await facilityService.deleteFacility(id);

      const imagePath = path.join(
        process.cwd(),
        "uploads",
        "facilities",
        `${id}.webp`
      );

      await fs.unlink(imagePath).catch(() => { });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const facilitiesController = new FacilitiesController();