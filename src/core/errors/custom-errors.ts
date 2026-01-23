export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier 
      ? `${resource} with id ${identifier} not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class BookingConflictError extends ConflictError {
  constructor(facilityName: string, date: string, time: string) {
    super(
      `Facility "${facilityName}" is already booked on ${date} at ${time}`
    );
    this.code = 'BOOKING_CONFLICT';
  }
}

export class BookingLimitExceededError extends ConflictError {
  constructor(limit: number = 4) {
    super(`You have reached the maximum of ${limit} bookings per day`);
    this.code = 'BOOKING_LIMIT_EXCEEDED';
  }
}

export class InvalidTimeSlotError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.code = 'INVALID_TIME_SLOT';
  }
}

export class FacilityClosedError extends ValidationError {
  constructor(facilityName: string, requestedTime: string) {
    super(`Facility "${facilityName}" is closed at ${requestedTime}`);
    this.code = 'FACILITY_CLOSED';
  }
}

export class BookingTooFarInAdvanceError extends ValidationError {
  constructor(maxDays: number = 3) {
    super(`Bookings can only be made up to ${maxDays} days in advance`);
    this.code = 'BOOKING_TOO_FAR_ADVANCE';
  }
}