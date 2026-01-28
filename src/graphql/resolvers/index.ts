import { queryResolvers } from './query.resolvers';
import { mutationResolvers } from './mutation.resolvers';
import { bookingFieldResolvers } from './booking.resolvers';

export const resolvers = {
  ...queryResolvers,
  ...mutationResolvers,
  ...bookingFieldResolvers
};