import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import depthLimit from 'graphql-depth-limit';
import { createContext, GraphQLContext } from './context';
import { resolvers } from './resolvers';
import { logger } from '@utils/logger';
import { formatError } from './error.formatter';

dotenv.config();

// Load GraphQL schema
const typeDefs = readFileSync(
  join(__dirname, 'schema', 'schema.graphql'),
  'utf-8'
);

// Create Apollo Server
const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  
  // Error formatting
  formatError,
  
  // Validation rules
  validationRules: [
    // Prevent deeply nested queries (max depth: 7)
    depthLimit(7)
  ],
  
  // Introspection and playground
  introspection: process.env.NODE_ENV !== 'production',
  
  // Include stack traces in dev
  includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development'
});

// Start server
async function startServer() {
  const PORT = parseInt(process.env.GRAPHQL_PORT || '3002');
  
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: createContext
  });
  
  logger.info(`🚀 GraphQL API running at ${url}`);
  logger.info(`📊 GraphQL Playground: ${url}`);
}

// Start if this file is executed directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start GraphQL server:', error);
    process.exit(1);
  });
}

export default server;