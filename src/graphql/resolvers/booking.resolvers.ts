import { Booking } from '@core/types';
import { GraphQLContext } from '../context';

/**
 * Booking Field Resolvers
 * 
 * Resolves nested fields on Booking type using DataLoaders
 * to prevent N+1 query problem
 */
export const bookingFieldResolvers = {
  Booking: {
    /**
     * Resolve user field
     * Uses DataLoader to batch multiple user lookups
     */
    user: async (parent: Booking, _: any, context: GraphQLContext) => {
      const user = await context.dataloaders.userLoader.load(parent.userId);
      
      if (!user) {
        throw new Error(`User with id ${parent.userId} not found`);
      }
      
      return user;
    },

    /**
     * Resolve facility field
     * Uses DataLoader to batch multiple facility lookups
     */
    facility: async (parent: Booking, _: any, context: GraphQLContext) => {
      const facility = await context.dataloaders.facilityLoader.load(parent.facilityId);
      
      if (!facility) {
        throw new Error(`Facility with id ${parent.facilityId} not found`);
      }
      
      return facility;
    }
  }
};