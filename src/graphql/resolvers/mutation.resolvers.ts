import { GraphQLContext } from '../context';
import { userService } from '../../core/services/user.service';
import { bookingService } from '../../core/services/booking.service';
import { validate, loginSchema, createBookingSchema, updateFacilitySchema, createUserSchema, updateUserSchema, createFacilitySchema } from '../../core/validators/booking.validator';
import { facilityService } from '../../core/services/facility.service';
import { requireAuth, requireRole } from '../guard/auth.guard';
import { UserRole } from '../../core/types';

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
      requireAuth(context);

      const bookingData = validate(createBookingSchema, input);

      return await bookingService.createBooking(bookingData);
    },

    confirmBooking: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      requireAuth(context);
      return await bookingService.confirmBooking(id);
    },

    cancelBooking: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      requireAuth(context);
      return await bookingService.cancelBooking(id);
    },

    createFacility: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      requireRole(context, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      const data = validate(createFacilitySchema, input);
      return await facilityService.createFacility(data);
    },

    updateFacility: async (_: any, { id, input }: { id: number; input: any }, context: GraphQLContext) => {
      requireRole(context, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      const data = validate(updateFacilitySchema, input);
      return await facilityService.updateFacility(id, data);
    },

    deleteFacility: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      requireRole(context, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      return await facilityService.deleteFacility(id);
    },

    createUser: async (_: any, { input }: { input: any }, context: GraphQLContext) => {
      requireRole(context, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      const data = validate(createUserSchema, input);
      return await userService.createUser(data);
    },

    updateUser: async (_: any, { id, input }: { id: number; input: any }, context: GraphQLContext) => {
      requireRole(context, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      const data = validate(updateUserSchema, input);
      return await userService.updateUser(id, data);
    },

    deleteUser: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      requireRole(context, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      return await userService.deleteUser(id);
    },

    deleteBooking: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      requireRole(context, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
      return await bookingService.deleteBooking(id);
    },
  }
};