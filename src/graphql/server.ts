import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import depthLimit from 'graphql-depth-limit';
import { createContext, GraphQLContext } from './context';
import { resolvers } from './resolvers';
import { formatError } from './error.formatter';
import logger from '../utils/logger';

dotenv.config();

const typeDefs = readFileSync(
  join(__dirname, 'schema', 'schema.graphql'),
  'utf-8'
);

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  
  formatError,
  
  validationRules: [
    depthLimit(7)
  ],
  
  introspection: process.env.NODE_ENV !== 'production',
  
  includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development'
});

async function startServer() {
  const PORT = parseInt(process.env.GRAPHQL_PORT || '3002');
  
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: createContext
  });
  
  logger.info(`GraphQL API running at ${url}`);
  logger.info(`GraphQL Playground: ${url}`);
}

if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start GraphQL server:', error);
    process.exit(1);
  });
}

export default server;