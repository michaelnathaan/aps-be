import { query } from '../client';
import { User } from '../../core/types';

export const usersQueries = {
  async findById(id: number): Promise<User | null> {
    const sql = `
      SELECT 
        id,
        full_name as "fullName",
        phone_number as "phoneNumber",
        role,
        is_verified_tenant as "isVerifiedTenant",
        unit_number as "unitNumber",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;

    const result = await query<User>(sql, [id]);
    return result.rows[0] || null;
  },

  async findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const sql = `
      SELECT 
        id,
        full_name as "fullName",
        phone_number as "phoneNumber",
        role,
        is_verified_tenant as "isVerifiedTenant",
        unit_number as "unitNumber",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users
      WHERE id = ANY($1)
    `;

    const result = await query<User>(sql, [ids]);

    const userMap = new Map(result.rows.map(u => [u.id, u]));
    return ids.map(id => userMap.get(id)).filter(Boolean) as User[];
  },

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const sql = `
      SELECT 
        id,
        full_name as "fullName",
        phone_number as "phoneNumber",
        role,
        is_verified_tenant as "isVerifiedTenant",
        unit_number as "unitNumber",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM users
      WHERE phone_number = $1
    `;

    const result = await query<User>(sql, [phoneNumber]);
    return result.rows[0] || null;
  },

  async isVerifiedTenant(userId: number): Promise<boolean> {
    const sql = `
      SELECT is_verified_tenant as "isVerifiedTenant"
      FROM users
      WHERE id = $1
    `;

    const result = await query<{ isVerifiedTenant: boolean }>(sql, [userId]);
    return result.rows[0]?.isVerifiedTenant || false;
  }
};