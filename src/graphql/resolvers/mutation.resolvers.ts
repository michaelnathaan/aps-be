import { GraphQLError } from 'graphql';
import { GraphQLContext } from '../context';
import { userService } from '../../core/services/user.service';
import { bookingService } from '../../core/services/booking.service';
import { validate, loginSchema, createBookingSchema } from '../../core/validators/booking.validator';

/**
 * Uses the same services as REST API to ensure identical behavior
 */
export const mutationResolvers = {
  Mutation: {
    login: async (_: any, { input }: { input: any }) => {
      const credentials = validate(loginSchema, input);

      return await userService.login(credentials);
    },

    createBooking: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const bookingData = validate(createBookingSchema, input);

      return await bookingService.createBooking(bookingData);
    },

    confirmBooking: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      return await bookingService.confirmBooking(id);
    },

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