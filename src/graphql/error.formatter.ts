// error.formatter.ts
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AppError, ValidationError } from '../core/errors/custom-errors';
import logger from '../utils/logger';

export function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  const originalError = error instanceof GraphQLError ? error.originalError : error;

  // Always log the REAL error with full detail, never the formatted one
  logger.error({
    message: originalError instanceof Error ? originalError.message : formattedError.message,
    stack: originalError instanceof Error ? originalError.stack : undefined,
    path: formattedError.path,
    extensions: formattedError.extensions
  });

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

  const isDev = process.env.NODE_ENV === 'development';
  return {
    message: isDev
      ? (originalError instanceof Error ? originalError.message : formattedError.message)
      : 'An unexpected error occurred',
    extensions: {
      code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
      ...(isDev && originalError instanceof Error
        ? { stack: originalError.stack }
        : {})
    }
  };
}