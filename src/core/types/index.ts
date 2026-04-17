export enum UserRole {
  GUEST = 'guest',
  TENANT = 'tenant',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface User {
  id: number;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  isVerifiedTenant: boolean;
  unitNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Facility {
  id: number;
  name: string;
  description: string | null;
  pricePerHour: number;
  openTime: string; // HH:MM:SS format
  closeTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: number;
  userId: number;
  facilityId: number;
  bookingDate: Date;
  startTime: string; // HH:MM:SS format
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingDTO {
  userId: number;
  facilityId: number;
  bookingDate: Date;
  startTime: string;
  endTime: string;
}

export interface UpdateBookingDTO {
  status?: BookingStatus;
}

export interface BookingWithDetails extends Booking {
  user: User;
  facility: Facility;
}

export interface BookingRow {
  id: number;
  userId: number;
  facilityId: number;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;

  user_id: number;
  user_fullName: string;
  user_phoneNumber: string;
  user_role: UserRole;

  facility_id: number;
  facility_name: string;
  facility_description: string | null;
  facility_pricePerHour: number;
  facility_openTime: string;
  facility_closeTime: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserDashboard {
  user: User;
  bookings: BookingWithDetails[];
  bookingCountToday: number;
  upcomingBookings: number;
  totalSpent: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface BookingFilters {
  userId?: number;
  facilityId?: number;
  status?: BookingStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SlotAvailabilityQuery {
  facilityId: number;
  date: Date;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Authentication
export interface AuthPayload {
  userId: number;
  role: UserRole;
}

export interface LoginDTO {
  phoneNumber: string;
  password?: string;
}

export interface OTPDTO {
  sessionId: string;
  otp: string;
}

export interface OTPMessageDTO {
  phoneNumber: string;
  otp: string;
}

export interface ResendOTPDTO {
  sessionId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OTPSessionResponse {
  sessionId: string;
  expires: number;
}

export interface SessionDTO {
  phoneNumber: string;
}

export interface CreateFacilityDTO {
  name: string;
  description?: string | null;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  isActive?: boolean;
}

export interface UpdateFacilityDTO {
  name?: string;
  description?: string | null;
  pricePerHour?: number;
  openTime?: string;
  closeTime?: string;
  isActive?: boolean;
}

export interface CreateUserDTO {
  fullName: string;
  phoneNumber: string;
  role?: UserRole;
  isVerifiedTenant?: boolean;
  unitNumber?: string | null;
}

export interface UpdateUserDTO {
  fullName?: string;
  phoneNumber?: string;
  role?: UserRole;
  isVerifiedTenant?: boolean;
  unitNumber?: string | null;
}

export interface FonnteResponse {
  status: boolean;
  detail?: string;
  reason?: string;
  id?: string;
}