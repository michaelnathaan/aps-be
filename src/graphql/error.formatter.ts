import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AppError, ValidationError } from '../core/errors/custom-errors';
import logger from '../utils/logger';

/**
 * Format GraphQL errors
 * Converts custom errors to GraphQL error format
 */
export function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  logger.error({
    message: formattedError.message,
    path: formattedError.path,
    extensions: formattedError.extensions
  });

  const originalError = error instanceof GraphQLError ? error.originalError : error;

  if (originalError instanceof AppError) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
        ...(originalError instanceof ValidationError && originalError.fields 
          ? { fields: originalError.fields } 
          : {})
      }
    };
  }

  if (error instanceof GraphQLError && error.extensions?.code === 'GRAPHQL_VALIDATION_FAILED') {
    return formattedError;
  }

  return {
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : formattedError.message,
    extensions: {
      code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR'
    }
  };
}