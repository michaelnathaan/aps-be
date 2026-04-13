import { GraphQLError } from 'graphql';
import { GraphQLContext } from '../context';
import { UserRole } from '../../core/types';

export function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}

export function requireRole(context: GraphQLContext, roles: UserRole[]) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  if (!roles.includes(context.user.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}