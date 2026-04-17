import { User } from '../core/types';
import { DataLoaders, createDataLoaders } from './dataloaders';
import { userService } from '../core/services/user.service';
import { GraphQLError } from 'graphql';

export interface GraphQLContext {
  user?: User;
  dataloaders: DataLoaders;
}

export async function createContext({ req }: { req: any }): Promise<GraphQLContext> {
  const dataloaders = createDataLoaders();
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { dataloaders };
  }

  const token = authHeader.substring(7);

  try {
    const user = await userService.verifyToken(token);

    return {
      user,
      dataloaders
    };
  } catch (error) {
    throw new GraphQLError('Invalid or expired token', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}