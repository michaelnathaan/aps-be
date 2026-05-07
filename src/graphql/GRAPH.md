# GraphQL API Documentation

Endpoint: `http://localhost:3002/graphql`

Development playground/introspection is enabled outside production.

## Authentication

Protected resolvers require:

```json
{ "Authorization": "Bearer <token>" }
```

By default, `login` starts an OTP session. For load tests or local scenarios where login should be phone-number only, set:

```bash
DISABLE_OTP=true
```

With `DISABLE_OTP=true`, this login input returns a JWT directly:

```json
{ "input": { "phoneNumber": "+6281234567892" } }
```

## Auth Mutations

### `login`

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    sessionId
    expires
    user { id fullName phoneNumber role isVerifiedTenant unitNumber }
  }
}
```

Variables:

```json
{ "input": { "phoneNumber": "+6281234567892" } }
```

Default OTP response contains `sessionId` and `expires`. When `DISABLE_OTP=true`, response contains `token` and `user`.

### `verifyOtp`

```graphql
mutation VerifyOtp($input: OTPInput!) {
  verifyOtp(input: $input) {
    token
    user { id fullName phoneNumber role isVerifiedTenant unitNumber }
  }
}
```

Variables:

```json
{
  "input": {
    "sessionId": "8f1f2f20-5a28-4a61-a54b-4a17e09cfa40",
    "otp": "1234"
  }
}
```

### `resendOtp`

```graphql
mutation ResendOtp($input: ResendOTPInput!) {
  resendOtp(input: $input) {
    phoneNumber
    sessionId
    expires
  }
}
```

Variables:

```json
{ "input": { "sessionId": "8f1f2f20-5a28-4a61-a54b-4a17e09cfa40" } }
```

## Queries

### `me`

Protected.

```graphql
query GetMe {
  me { id fullName phoneNumber role isVerifiedTenant unitNumber }
}
```

### `facilities`

Public. Returns active facilities.

```graphql
query GetFacilities {
  facilities { id name description pricePerHour openTime closeTime isActive }
}
```

### `facility`

Public.

```graphql
query GetFacility($id: Int!) {
  facility(id: $id) { id name description pricePerHour openTime closeTime isActive }
}
```

Variables: `{ "id": 1 }`

### `availableSlots`

Public.

```graphql
query GetAvailableSlots($input: SlotAvailabilityInput!) {
  availableSlots(input: $input) {
    facilityId
    date
    slots { startTime endTime isAvailable }
  }
}
```

Variables:

```json
{ "input": { "facilityId": 1, "date": "2026-01-22" } }
```

### `bookings`

Admin or super admin only.

```graphql
query GetBookings {
  bookings {
    id bookingDate startTime endTime status totalPrice
    user { id fullName }
    facility { id name }
  }
}
```

### `booking`

Protected.

```graphql
query GetBooking($id: Int!) {
  booking(id: $id) {
    id bookingDate startTime endTime status totalPrice
    user { id fullName phoneNumber role }
    facility { id name pricePerHour }
  }
}
```

Variables: `{ "id": 301 }`

### `userBookings`

Protected. Uses optimized nested loading with DataLoader.

```graphql
query GetUserBookings($userId: Int!, $limit: Int!, $offset: Int!) {
  userBookings(userId: $userId, limit: $limit, offset: $offset) {
    id bookingDate startTime endTime status totalPrice
    user { id fullName phoneNumber role }
    facility { id name pricePerHour openTime closeTime }
  }
}
```

Variables: `{ "userId": 3, "limit": 10, "offset": 0 }`

### `userBookingsGeneric`

Protected. Returns the same shape as `userBookings`, but uses the plain query path for comparison tests.

```graphql
query GetUserBookingsGeneric($userId: Int!, $limit: Int!, $offset: Int!) {
  userBookingsGeneric(userId: $userId, limit: $limit, offset: $offset) {
    id bookingDate startTime endTime status totalPrice
    user { id fullName phoneNumber role }
    facility { id name pricePerHour }
  }
}
```

### `userDashboard`

Protected.

```graphql
query GetUserDashboard($userId: Int!, $limit: Int!, $offset: Int!) {
  userDashboard(userId: $userId, limit: $limit, offset: $offset) {
    user { id fullName phoneNumber role isVerifiedTenant unitNumber }
    bookings {
      id bookingDate startTime endTime status totalPrice
      facility { id name pricePerHour }
    }
    bookingCountToday
    upcomingBookings
    totalSpent
  }
}
```

Variables: `{ "userId": 3, "limit": 10, "offset": 0 }`

### `users`

Admin or super admin only.

```graphql
query GetUsers {
  users { id fullName phoneNumber role isVerifiedTenant unitNumber }
}
```

### `user`

Protected.

```graphql
query GetUser($id: Int!) {
  user(id: $id) { id fullName phoneNumber role isVerifiedTenant unitNumber }
}
```

Variables: `{ "id": 3 }`

## Domain Mutations

### `createBooking`

Protected.

```graphql
mutation CreateBooking($input: CreateBookingInput!) {
  createBooking(input: $input) {
    id bookingDate startTime endTime status totalPrice
    user { fullName }
    facility { name }
  }
}
```

Variables:

```json
{
  "input": {
    "userId": 3,
    "facilityId": 1,
    "bookingDate": "2026-01-22",
    "startTime": "14:00:00",
    "endTime": "15:00:00"
  }
}
```

### `confirmBooking`

Protected.

```graphql
mutation ConfirmBooking($id: Int!) {
  confirmBooking(id: $id) { id status }
}
```

Variables: `{ "id": 301 }`

### `cancelBooking`

Protected.

```graphql
mutation CancelBooking($id: Int!) {
  cancelBooking(id: $id) { id status }
}
```

Variables: `{ "id": 301 }`

### `deleteBooking`

Admin or super admin only. Permanently deletes a booking.

```graphql
mutation DeleteBooking($id: Int!) {
  deleteBooking(id: $id)
}
```

Variables: `{ "id": 301 }`

### `createFacility`

Admin or super admin only.

```graphql
mutation CreateFacility($input: CreateFacilityInput!) {
  createFacility(input: $input) {
    id name description pricePerHour openTime closeTime isActive
  }
}
```

Variables:

```json
{
  "input": {
    "name": "Swimming Pool",
    "description": "Olympic-size indoor pool",
    "pricePerHour": 75000,
    "openTime": "06:00:00",
    "closeTime": "21:00:00",
    "isActive": true
  }
}
```

### `updateFacility`

Admin or super admin only.

```graphql
mutation UpdateFacility($id: Int!, $input: UpdateFacilityInput!) {
  updateFacility(id: $id, input: $input) {
    id name pricePerHour isActive
  }
}
```

Variables: `{ "id": 1, "input": { "pricePerHour": 80000, "isActive": false } }`

### `deleteFacility`

Admin or super admin only.

```graphql
mutation DeleteFacility($id: Int!) {
  deleteFacility(id: $id)
}
```

Variables: `{ "id": 1 }`

### `createUser`

Admin or super admin only.

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id fullName phoneNumber role isVerifiedTenant unitNumber
  }
}
```

Variables:

```json
{
  "input": {
    "fullName": "Siti Rahayu",
    "phoneNumber": "+6289876543210",
    "role": "tenant",
    "isVerifiedTenant": true,
    "unitNumber": "0802"
  }
}
```

### `updateUser`

Admin or super admin only.

```graphql
mutation UpdateUser($id: Int!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id fullName role isVerifiedTenant unitNumber
  }
}
```

Variables: `{ "id": 3, "input": { "isVerifiedTenant": true, "unitNumber": "1203" } }`

### `deleteUser`

Admin or super admin only.

```graphql
mutation DeleteUser($id: Int!) {
  deleteUser(id: $id)
}
```

Variables: `{ "id": 3 }`

## Error Handling

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "statusCode": 400,
        "fields": {
          "phoneNumber": "Phone number must contain only digits and optional + prefix"
        }
      }
    }
  ]
}
```

Common codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `BOOKING_CONFLICT`, `BOOKING_LIMIT_EXCEEDED`, `INVALID_TIME_SLOT`, `FACILITY_CLOSED`, `CONFLICT`, `INTERNAL_SERVER_ERROR`.
