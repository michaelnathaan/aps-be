import { GraphQLError } from 'graphql';
import { GraphQLContext } from '../context';
import { userService } from '@core/services/user.service';
import { bookingService } from '@core/services/booking.service';
import { validate, loginSchema, createBookingSchema } from '@core/validators/booking.validator';

/**
 * Mutation Resolvers
 * 
 * Uses the same services as REST API to ensure identical behavior
 */
export const mutationResolvers = {
  Mutation: {
    /**
     * Login with phone number
     */
    login: async (_: any, { input }: { input: any }) => {
      // Validate input
      const credentials = validate(loginSchema, input);
      
      // Authenticate
      return await userService.login(credentials);
    },

    /**
     * Create a new booking
     */
    createBooking: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      // Validate input
      const bookingData = validate(createBookingSchema, input);
      
      // Create booking
      return await bookingService.createBooking(bookingData);
    },

    /**
     * Confirm a booking
     */
    confirmBooking: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await bookingService.confirmBooking(id);
    },

    /**
     * Cancel a booking
     */
    cancelBooking: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await bookingService.cancelBooking(id);
    }
  }
};