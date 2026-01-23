import { query } from '../client';
import { Facility } from '@core/types';

export const facilitiesQueries = {
  /**
   * Get all active facilities
   */
  async findAll(): Promise<Facility[]> {
    const sql = `
      SELECT 
        id,
        name,
        description,
        price_per_hour as "pricePerHour",
        open_time as "openTime",
        close_time as "closeTime",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM facilities
      WHERE is_active = true
      ORDER BY name ASC
    `;
    
    const result = await query<Facility>(sql);
    return result.rows;
  },

  /**
   * Get facility by ID
   */
  async findById(id: number): Promise<Facility | null> {
    const sql = `
      SELECT 
        id,
        name,
        description,
        price_per_hour as "pricePerHour",
        open_time as "openTime",
        close_time as "closeTime",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM facilities
      WHERE id = $1
    `;
    
    const result = await query<Facility>(sql, [id]);
    return result.rows[0] || null;
  },

  /**
   * Get multiple facilities by IDs (for DataLoader batching)
   */
  async findByIds(ids: number[]): Promise<Facility[]> {
    if (ids.length === 0) return [];
    
    const sql = `
      SELECT 
        id,
        name,
        description,
        price_per_hour as "pricePerHour",
        open_time as "openTime",
        close_time as "closeTime",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM facilities
      WHERE id = ANY($1)
    `;
    
    const result = await query<Facility>(sql, [ids]);
    
    // Return in same order as input IDs
    const facilityMap = new Map(result.rows.map(f => [f.id, f]));
    return ids.map(id => facilityMap.get(id)).filter(Boolean) as Facility[];
  },

  /**
   * Check if facility is active
   */
  async isActive(id: number): Promise<boolean> {
    const sql = `
      SELECT is_active as "isActive"
      FROM facilities
      WHERE id = $1
    `;
    
    const result = await query<{ isActive: boolean }>(sql, [id]);
    return result.rows[0]?.isActive || false;
  }
};