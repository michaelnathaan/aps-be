import { Booking, BookingWithDetails } from '../../core/types';
import { GraphQLContext } from '../context';

/**
 * Booking Field Resolvers
 * 
 * NOTE: For queries that return BookingWithDetails (like userBookings),
 * the user and facility are already included in the SQL query.
 * 
 * Field resolvers are only needed for queries that return plain Booking objects
 * without the nested data (like getBookingById).
 */
export const bookingFieldResolvers = {
  Booking: {
    /**
     * Resolve user field (only if not already present)
     * Uses DataLoader to batch multiple user lookups
     */
    user: async (parent: Booking | BookingWithDetails, _: any, context: GraphQLContext) => {
      // If user is already present (from SQL JOIN), return it
      if ('user' in parent && parent.user) {
        return parent.user;
      }
      
      // Otherwise, use DataLoader (for queries that return plain Booking)
      const user = await context.dataloaders.userLoader.load(parent.userId);
      
      if (!user) {
        throw new Error(`User with id ${parent.userId} not found`);
      }
      
      return user;
    },

    /**
     * Resolve facility field (only if not already present)
     * Uses DataLoader to batch multiple facility lookups
     */
    facility: async (parent: Booking | BookingWithDetails, _: any, context: GraphQLContext) => {
      // If facility is already present (from SQL JOIN), return it
      if ('facility' in parent && parent.facility) {
        return parent.facility;
      }
      
      // Otherwise, use DataLoader (for queries that return plain Booking)
      const facility = await context.dataloaders.facilityLoader.load(parent.facilityId);
      
      if (!facility) {
        throw new Error(`Facility with id ${parent.facilityId} not found`);
      }
      
      return facility;
    }
  }
};