import http from 'k6/http';
import { check } from 'k6';

/**
 * Get JWT token for REST API
 */
export function getRESTToken(baseUrl, phoneNumber) {
  const response = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ phoneNumber }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'login successful': (r) => r.status === 200,
  });
  
  const body = JSON.parse(response.body);
  return body.token;
}

/**
 * Get JWT token for GraphQL API
 */
export function getGraphQLToken(graphqlUrl, phoneNumber) {
  const query = `
    mutation Login($phoneNumber: String!) {
      login(input: { phoneNumber: $phoneNumber }) {
        token
      }
    }
  `;
  
  const response = http.post(
    graphqlUrl,
    JSON.stringify({
      query: query,
      variables: { phoneNumber },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'login successful': (r) => r.status === 200,
  });
  
  const body = JSON.parse(response.body);
  return body.data.login.token;
}

/**
 * Create authorization header
 */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}