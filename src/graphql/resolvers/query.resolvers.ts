import { GraphQLError } from 'graphql';
import { GraphQLContext } from '../context';
import { facilityService } from '@core/services/facility.service';
import { bookingService } from '@core/services/booking.service';
import { userService } from '@core/services/user.service';
import { validate, slotAvailabilitySchema } from '@core/validators/booking.validator';

/**
 * Query Resolvers
 * 
 * Uses the same services as REST API to ensure identical behavior
 */
export const queryResolvers = {
  Query: {
    /**
     * Get current authenticated user
     */
    me: (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      return context.user;
    },

    /**
     * Get all facilities
     */
    facilities: async () => {
      return await facilityService.getAllFacilities();
    },

    /**
     * Get facility by ID
     */
    facility: async (_: any, { id }: { id: number }) => {
      return await facilityService.getFacilityById(id);
    },

    /**
     * Get available slots for a facility
     */
    availableSlots: async (_: any, { input }: { input: any }) => {
      // Validate input
      const params = validate(slotAvailabilitySchema, input);
      
      const slots = await facilityService.getAvailableSlots(params);
      
      return {
        facilityId: params.facilityId,
        date: params.date.toISOString(),
        slots
      };
    },

    /**
     * Get booking by ID
     */
    booking: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await bookingService.getBookingById(id);
    },

    /**
     * Get user by ID
     */
    user: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await userService.getUserById(id);
    },

    /**
     * Get user's bookings
     */
    userBookings: async (_: any, { userId }: { userId: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await bookingService.getUserBookings(userId);
    },

    /**
     * Get user dashboard
     */
    userDashboard: async (_: any, { userId }: { userId: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await userService.getUserDashboard(userId);
    }
  }
};