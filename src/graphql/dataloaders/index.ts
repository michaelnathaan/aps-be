import DataLoader from 'dataloader';
import { User, Facility } from '../../core/types';
import { usersQueries } from '../../db/queries/users.queries';
import { facilitiesQueries } from '../../db/queries/facilities.queries';

/**
 * DataLoaders for batching and caching database queries
 * Prevents N+1 query problem in GraphQL
 * 
 * Created per-request to ensure proper caching scope
 */

/**
 * Batches multiple user lookups into a single query
 */
export function createUserLoader(): DataLoader<number, User | null> {
  return new DataLoader<number, User | null>(
    async (userIds) => {
      const users = await usersQueries.findByIds(userIds as number[]);
      
      // Create a map for O(1) lookup
      const userMap = new Map(users.map(u => [u.id, u]));
      
      // Return users in the same order as input IDs
      return userIds.map(id => userMap.get(id) || null);
    },
    {
      cache: true,
      batchScheduleFn: (callback) => process.nextTick(callback)
    }
  );
}

/**
 * Batches multiple facility lookups into a single query
 */
export function createFacilityLoader(): DataLoader<number, Facility | null> {
  return new DataLoader<number, Facility | null>(
    async (facilityIds) => {
      const facilities = await facilitiesQueries.findByIds(facilityIds as number[]);
      
      // Create a map for O(1) lookup
      const facilityMap = new Map(facilities.map(f => [f.id, f]));
      
      // Return facilities in the same order as input IDs
      return facilityIds.map(id => facilityMap.get(id) || null);
    },
    {
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 10)
    }
  );
}

/**
 * Creates all dataloaders for a request
 */
export interface DataLoaders {
  userLoader: DataLoader<number, User | null>;
  facilityLoader: DataLoader<number, Facility | null>;
}

export function createDataLoaders(): DataLoaders {
  return {
    userLoader: createUserLoader(),
    facilityLoader: createFacilityLoader()
  };
}