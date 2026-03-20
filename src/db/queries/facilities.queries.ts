import { query } from '../client';
import { Facility } from '../../core/types';

const FACILITY_SELECT = `
  id,
  name,
  description,
  price_per_hour as "pricePerHour",
  open_time as "openTime",
  close_time as "closeTime",
  is_active as "isActive",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

export const facilitiesQueries = {
  async findAll(): Promise<Facility[]> {
    const result = await query<Facility>(`SELECT ${FACILITY_SELECT} FROM facilities WHERE is_active = true ORDER BY name ASC`);
    return result.rows;
  },

  async findAllIncludingInactive(): Promise<Facility[]> {
    const result = await query<Facility>(`SELECT ${FACILITY_SELECT} FROM facilities ORDER BY name ASC`);
    return result.rows;
  },

  async findById(id: number): Promise<Facility | null> {
    const result = await query<Facility>(`SELECT ${FACILITY_SELECT} FROM facilities WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async findByIds(ids: number[]): Promise<Facility[]> {
    if (ids.length === 0) return [];
    const result = await query<Facility>(`SELECT ${FACILITY_SELECT} FROM facilities WHERE id = ANY($1)`, [ids]);
    const map = new Map(result.rows.map(f => [f.id, f]));
    return ids.map(id => map.get(id)).filter(Boolean) as Facility[];
  },

  async isActive(id: number): Promise<boolean> {
    const result = await query<{ isActive: boolean }>(`SELECT is_active as "isActive" FROM facilities WHERE id = $1`, [id]);
    return result.rows[0]?.isActive || false;
  },

  async create(data: {
    name: string;
    description?: string | null;
    pricePerHour: number;
    openTime: string;
    closeTime: string;
    isActive?: boolean;
  }): Promise<Facility> {
    const sql = `
      INSERT INTO facilities (name, description, price_per_hour, open_time, close_time, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${FACILITY_SELECT}
    `;
    const result = await query<Facility>(sql, [
      data.name,
      data.description ?? null,
      data.pricePerHour,
      data.openTime,
      data.closeTime,
      data.isActive ?? true,
    ]);
    return result.rows[0];
  },

  async update(id: number, data: {
    name?: string;
    description?: string | null;
    pricePerHour?: number;
    openTime?: string;
    closeTime?: string;
    isActive?: boolean;
  }): Promise<Facility | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (data.pricePerHour !== undefined) { fields.push(`price_per_hour = $${idx++}`); values.push(data.pricePerHour); }
    if (data.openTime !== undefined) { fields.push(`open_time = $${idx++}`); values.push(data.openTime); }
    if (data.closeTime !== undefined) { fields.push(`close_time = $${idx++}`); values.push(data.closeTime); }
    if (data.isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.isActive); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE facilities SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${FACILITY_SELECT}`;
    const result = await query<Facility>(sql, values);
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM facilities WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  },
};