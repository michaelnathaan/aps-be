import { User } from '@core/types';
import { DataLoaders, createDataLoaders } from './dataloaders';
import { userService } from '@core/services/user.service';

/**
 * GraphQL Context
 * 
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
  // Initialize dataloaders (per-request)
  const dataloaders = createDataLoaders();
  
  // Extract token from Authorization header
  const authHeader = req.headers.authorization || '';
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Verify token and get user
      const user = await userService.verifyToken(token);
      
      return {
        user,
        dataloaders
      };
    } catch (error) {
      // Invalid token - continue without user
      return { dataloaders };
    }
  }
  
  // No token provided
  return { dataloaders };
}