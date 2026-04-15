import { query } from '../client';
import { Booking, BookingWithDetails, BookingStatus, BookingRow } from '../../core/types';

export const bookingsQueries = {
  async findAll(): Promise<Booking[]> {
    const sql = `
      SELECT 
        id,
        user_id as "userId",
        facility_id as "facilityId",
        booking_date as "bookingDate",
        start_time as "startTime",
        end_time as "endTime",
        status,
        total_price as "totalPrice",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM bookings
    `;
    const result = await query<Booking>(sql);
    return result.rows;
  },
  async create(data: {
    userId: number;
    facilityId: number;
    bookingDate: Date;
    startTime: string;
    endTime: string;
    totalPrice: number;
  }): Promise<Booking> {
    const sql = `
      INSERT INTO bookings (
        user_id, facility_id, booking_date, 
        start_time, end_time, total_price, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING 
        id,
        user_id as "userId",
        facility_id as "facilityId",
        booking_date as "bookingDate",
        start_time as "startTime",
        end_time as "endTime",
        status,
        total_price as "totalPrice",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<Booking>(sql, [
      data.userId,
      data.facilityId,
      data.bookingDate,
      data.startTime,
      data.endTime,
      data.totalPrice
    ]);

    return result.rows[0];
  },

  async findById(id: number): Promise<Booking | null> {
    const sql = `
      SELECT 
        id,
        user_id as "userId",
        facility_id as "facilityId",
        booking_date as "bookingDate",
        start_time as "startTime",
        end_time as "endTime",
        status,
        total_price as "totalPrice",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM bookings
      WHERE id = $1
    `;

    const result = await query<Booking>(sql, [id]);
    return result.rows[0] || null;
  },

  async findByIdWithDetails(id: number): Promise<BookingWithDetails | null> {
    const sql = `
      SELECT 
        b.id,
        b.user_id as "userId",
        b.facility_id as "facilityId",
        b.booking_date as "bookingDate",
        b.start_time as "startTime",
        b.end_time as "endTime",
        b.status,
        b.total_price as "totalPrice",
        b.created_at as "createdAt",
        b.updated_at as "updatedAt",
        
        -- User details
        json_build_object(
          'id', u.id,
          'fullName', u.full_name,
          'phoneNumber', u.phone_number,
          'role', u.role,
          'isVerifiedTenant', u.is_verified_tenant,
          'unitNumber', u.unit_number,
          'createdAt', u.created_at,
          'updatedAt', u.updated_at
        ) as user,
        
        -- Facility details
        json_build_object(
          'id', f.id,
          'name', f.name,
          'description', f.description,
          'pricePerHour', f.price_per_hour,
          'openTime', f.open_time,
          'closeTime', f.close_time,
          'isActive', f.is_active,
          'createdAt', f.created_at,
          'updatedAt', f.updated_at
        ) as facility
        
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN facilities f ON b.facility_id = f.id
      WHERE b.id = $1
    `;

    const result = await query<BookingWithDetails>(sql, [id]);
    return result.rows[0] || null;
  },

  async getUserDashboardStats(userId: number): Promise<{
    bookingCountToday: number;
    upcomingBookings: number;
    totalSpent: number;
  }> {
    const sql = `
    SELECT
      COUNT(*) FILTER (
        WHERE booking_date = CURRENT_DATE
        AND status IN ('pending', 'confirmed')
      ) as "bookingCountToday",

      COUNT(*) FILTER (
        WHERE booking_date > CURRENT_DATE
        AND status IN ('pending', 'confirmed')
      ) as "upcomingBookings",

      COALESCE(SUM(total_price) FILTER (
        WHERE status = 'confirmed'
      ), 0) as "totalSpent"

    FROM bookings
    WHERE user_id = $1
  `;

    const result = await query(sql, [userId]);
    return result.rows[0];
  },

  async findByUserIdPaginatedWithFacility(
    userId: number,
    limit: number,
    offset: number
  ): Promise<any[]> {
    const sql = `
      SELECT 
        b.id,
        b.user_id as "userId",
        b.facility_id as "facilityId",
        b.booking_date as "bookingDate",
        b.start_time as "startTime",
        b.end_time as "endTime",
        b.status,
        b.total_price as "totalPrice",

        -- Still join Facility (REST needs this data immediately)
        json_build_object(
          'id', f.id,
          'name', f.name,
          'pricePerHour', f.price_per_hour
        ) as facility

      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [userId, limit, offset]);
    return result.rows;
  },


  async findByUserIdPaginated(
    userId: number,
    limit: number,
    offset: number
  ): Promise<BookingRow[]> {
    const sql = `
    SELECT 
  b.id,
  b.user_id as "userId",
  b.facility_id as "facilityId",
  b.booking_date as "bookingDate",
  b.start_time as "startTime",
  b.end_time as "endTime",
  b.status,
  b.total_price as "totalPrice",

  -- user (flattened)
  u.id as "user_id",
  u.full_name as "user_fullName",
  u.phone_number as "user_phoneNumber",
  u.role as "user_role",

  -- facility (flattened)
  f.id as "facility_id",
  f.name as "facility_name",
  f.description as "facility_description",
  f.price_per_hour as "facility_pricePerHour",
  f.open_time as "facility_openTime",
  f.close_time as "facility_closeTime"

FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN facilities f ON b.facility_id = f.id
WHERE b.user_id = $1
ORDER BY b.booking_date DESC, b.start_time DESC
LIMIT $2 OFFSET $3
  `;

    const result = await query<BookingRow>(sql, [userId, limit, offset]);
    return result.rows;
  },

  async findByUserIdPaginatedPlain(
    userId: number,
    limit: number,
    offset: number
  ): Promise<Booking[]> {
    const sql = `
    SELECT 
      b.id,
      b.user_id as "userId",
      b.facility_id as "facilityId",
      b.booking_date as "bookingDate",
      b.start_time as "startTime",
      b.end_time as "endTime",
      b.status,
      b.total_price as "totalPrice"
    FROM bookings b
    WHERE b.user_id = $1
    ORDER BY b.booking_date DESC, b.start_time DESC
    LIMIT $2 OFFSET $3
  `;
    const result = await query<Booking>(sql, [userId, limit, offset]);
    return result.rows;
  },

  async checkConflict(
    facilityId: number,
    bookingDate: Date,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const sql = `
      SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE facility_id = $1
          AND booking_date = $2
          AND status IN ('pending', 'confirmed')
          AND (start_time, end_time) OVERLAPS ($3::time, $4::time)
      ) as "hasConflict"
    `;

    const result = await query<{ hasConflict: boolean }>(sql, [
      facilityId,
      bookingDate,
      startTime,
      endTime
    ]);

    return result.rows[0].hasConflict;
  },

  async countUserBookingsOnDate(userId: number, date: Date): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE user_id = $1
        AND booking_date = $2
        AND status IN ('pending', 'confirmed')
    `;

    const result = await query<{ count: string }>(sql, [userId, date]);
    return parseInt(result.rows[0].count);
  },

  async getBookedSlots(facilityId: number, date: Date): Promise<{ startTime: string; endTime: string }[]> {
    const sql = `
      SELECT 
        start_time as "startTime",
        end_time as "endTime"
      FROM bookings
      WHERE facility_id = $1
        AND booking_date = $2
        AND status IN ('pending', 'confirmed')
      ORDER BY start_time ASC
    `;

    const result = await query<{ startTime: string; endTime: string }>(sql, [
      facilityId,
      date
    ]);

    return result.rows;
  },

  async updateStatus(id: number, status: BookingStatus): Promise<Booking> {
    const sql = `
      UPDATE bookings
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING 
        id,
        user_id as "userId",
        facility_id as "facilityId",
        booking_date as "bookingDate",
        start_time as "startTime",
        end_time as "endTime",
        status,
        total_price as "totalPrice",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await query<Booking>(sql, [status, id]);
    return result.rows[0];
  },
  async delete(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM bookings WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  },
};