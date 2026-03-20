import { query } from '../client';
import { User, UserRole } from '../../core/types';

const USER_SELECT = `
  id,
  full_name as "fullName",
  phone_number as "phoneNumber",
  role,
  is_verified_tenant as "isVerifiedTenant",
  unit_number as "unitNumber",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

export const usersQueries = {
  async findById(id: number): Promise<User | null> {
    const result = await query<User>(`SELECT ${USER_SELECT} FROM users WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const result = await query<User>(`SELECT ${USER_SELECT} FROM users WHERE id = ANY($1)`, [ids]);
    const map = new Map(result.rows.map(u => [u.id, u]));
    return ids.map(id => map.get(id)).filter(Boolean) as User[];
  },

  async findAll(): Promise<User[]> {
    const result = await query<User>(`SELECT ${USER_SELECT} FROM users ORDER BY id ASC`);
    return result.rows;
  },

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const result = await query<User>(`SELECT ${USER_SELECT} FROM users WHERE phone_number = $1`, [phoneNumber]);
    return result.rows[0] || null;
  },

  async isVerifiedTenant(userId: number): Promise<boolean> {
    const result = await query<{ isVerifiedTenant: boolean }>(
      `SELECT is_verified_tenant as "isVerifiedTenant" FROM users WHERE id = $1`, [userId]
    );
    return result.rows[0]?.isVerifiedTenant || false;
  },

  async create(data: {
    fullName: string;
    phoneNumber: string;
    role?: UserRole;
    isVerifiedTenant?: boolean;
    unitNumber?: string | null;
  }): Promise<User> {
    const sql = `
      INSERT INTO users (full_name, phone_number, role, is_verified_tenant, unit_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${USER_SELECT}
    `;
    const result = await query<User>(sql, [
      data.fullName,
      data.phoneNumber,
      data.role ?? UserRole.GUEST,
      data.isVerifiedTenant ?? false,
      data.unitNumber ?? null,
    ]);
    return result.rows[0];
  },

  async update(id: number, data: {
    fullName?: string;
    phoneNumber?: string;
    role?: UserRole;
    isVerifiedTenant?: boolean;
    unitNumber?: string | null;
  }): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.fullName !== undefined) { fields.push(`full_name = $${idx++}`); values.push(data.fullName); }
    if (data.phoneNumber !== undefined) { fields.push(`phone_number = $${idx++}`); values.push(data.phoneNumber); }
    if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role); }
    if (data.isVerifiedTenant !== undefined) { fields.push(`is_verified_tenant = $${idx++}`); values.push(data.isVerifiedTenant); }
    if (data.unitNumber !== undefined) { fields.push(`unit_number = $${idx++}`); values.push(data.unitNumber); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${USER_SELECT}`;
    const result = await query<User>(sql, values);
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM users WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  },
};