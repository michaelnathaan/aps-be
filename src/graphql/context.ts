import { User } from '../core/types';
import { DataLoaders, createDataLoaders } from './dataloaders';
import { userService } from '../core/services/user.service';

/**
 * Available to all resolvers via the context parameter.
 * Contains:
 * - User (if authenticated)
 * - DataLoaders (for batching)
 */
export interface GraphQLContext {
  user?: User;
  dataloaders: DataLoaders;
}

/**
 * Create GraphQL context for each request
 * 
 * Extracts JWT token from Authorization header,
 * verifies it, and attaches user to context.
 * Creates new dataloaders per request.
 */
export async function createContext({ req }: { req: any }): Promise<GraphQLContext> {
  const dataloaders = createDataLoaders();

  const authHeader = req.headers.authorization || '';

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const user = await userService.verifyToken(token);

      return {
        user,
        dataloaders
      };
    } catch (error) {
      return { dataloaders };
    }
  }

  return { dataloaders };
}