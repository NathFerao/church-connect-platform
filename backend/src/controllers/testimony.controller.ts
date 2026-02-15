import { Request, Response, NextFunction } from 'express';
import { TestimonyService } from '../services/testimony.service';
import { successResponse, parseQueryParams } from '../utils/helpers';
import { getParam } from '../utils/params';

export class TestimonyController {
  private testimonyService: TestimonyService;

  constructor() {
    this.testimonyService = new TestimonyService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = parseQueryParams(req.query);
      const result = await this.testimonyService.getTestimonies(
        req.churchId!,
        req.user!.role,
        params
      );
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getFeatured = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const testimonies = await this.testimonyService.getFeatured(req.churchId!);
      res.json(successResponse(testimonies));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const testimony = await this.testimonyService.getTestimonyById(
        getParam(req, 'id'),
        req.churchId!
      );
      res.json(successResponse(testimony));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const testimony = await this.testimonyService.createTestimony(
        req.body,
        req.user!.id,
        req.churchId!
      );
      res.status(201).json(successResponse(testimony, 'Testimony created successfully'));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const testimony = await this.testimonyService.updateTestimony(
        getParam(req, 'id'),
        req.body,
        req.user!.id,
        req.user!.role,
        req.churchId!
      );
      res.json(successResponse(testimony, 'Testimony updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.testimonyService.deleteTestimony(
        getParam(req, 'id'),
        req.user!.id,
        req.user!.role,
        req.churchId!
      );
      res.json(successResponse(null, 'Testimony deleted successfully'));
    } catch (error) {
      next(error);
    }
  };
}