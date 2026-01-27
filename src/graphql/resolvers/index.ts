import { queryResolvers } from './query.resolvers';
import { mutationResolvers } from './mutation.resolvers';
import { bookingFieldResolvers } from './booking.resolvers';

/**
 * Combined resolvers
 * Merges all resolver objects into one
 */
export const resolvers = {
  ...queryResolvers,
  ...mutationResolvers,
  ...bookingFieldResolvers
};