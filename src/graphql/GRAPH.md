# GraphQL API Documentation

Endpoint: `http://localhost:3002/graphql`

Playground: `http://localhost:3002/` (development only)

---

## Authentication

Include JWT token in HTTP headers:

```json
{
  "Authorization": "Bearer <token>"
}
```

---

## Queries

### **me**
Get current authenticated user.

**Query:**
```graphql
query GetMe {
  me {
    id
    fullName
    phoneNumber
    role
    isVerifiedTenant
    unitNumber
  }
}
```

**Response:**
```json
{
  "data": {
    "me": {
      "id": 3,
      "fullName": "Budi Santoso",
      "phoneNumber": "+6281234567892",
      "role": "TENANT",
      "isVerifiedTenant": true,
      "unitNumber": "1703"
    }
  }
}
```

---

### **facilities**
Get all active facilities.

**Query:**
```graphql
query GetFacilities {
  facilities {
    id
    name
    description
    pricePerHour
    openTime
    closeTime
    isActive
  }
}
```

**Response:**
```json
{
  "data": {
    "facilities": [
      {
        "id": 1,
        "name": "Tennis Court",
        "description": "Outdoor tennis court...",
        "pricePerHour": 50000,
        "openTime": "06:00:00",
        "closeTime": "22:00:00",
        "isActive": true
      }
    ]
  }
}
```

---

### **facility**
Get facility by ID.

**Query:**
```graphql
query GetFacility($id: Int!) {
  facility(id: $id) {
    id
    name
    description
    pricePerHour
    openTime
    closeTime
  }
}
```

**Variables:**
```json
{
  "id": 1
}
```

---

### **availableSlots**
Get available time slots for a facility.

**Query:**
```graphql
query GetAvailableSlots($input: SlotAvailabilityInput!) {
  availableSlots(input: $input) {
    facilityId
    date
    slots {
      startTime
      endTime
      isAvailable
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "facilityId": 1,
    "date": "2026-01-22"
  }
}
```

**Response:**
```json
{
  "data": {
    "availableSlots": {
      "facilityId": 1,
      "date": "2026-01-22T00:00:00.000Z",
      "slots": [
        {
          "startTime": "06:00:00",
          "endTime": "07:00:00",
          "isAvailable": false
        },
        {
          "startTime": "07:00:00",
          "endTime": "08:00:00",
          "isAvailable": true
        }
      ]
    }
  }
}
```

---

### **booking**
Get booking by ID.

**Query:**
```graphql
query GetBooking($id: Int!) {
  booking(id: $id) {
    id
    bookingDate
    startTime
    endTime
    status
    totalPrice
    user {
      id
      fullName
    }
    facility {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "id": 301
}
```

---

### **userBookings**
Get all bookings for a user.

**Query:**
```graphql
query GetUserBookings($userId: Int!) {
  userBookings(userId: $userId) {
    id
    bookingDate
    startTime
    endTime
    status
    totalPrice
    facility {
      name
      pricePerHour
    }
  }
}
```

**Variables:**
```json
{
  "userId": 3
}
```

---

### **userDashboard**
Get user dashboard with statistics.

**Query:**
```graphql
query GetUserDashboard($userId: Int!) {
  userDashboard(userId: $userId) {
    user {
      id
      fullName
      role
    }
    bookings {
      id
      bookingDate
      status
      facility {
        name
      }
    }
    bookingCountToday
    upcomingBookings
    totalSpent
  }
}
```

**Variables:**
```json
{
  "userId": 3
}
```

**Response:**
```json
{
  "data": {
    "userDashboard": {
      "user": {
        "id": 3,
        "fullName": "Budi Santoso",
        "role": "TENANT"
      },
      "bookings": [...],
      "bookingCountToday": 1,
      "upcomingBookings": 3,
      "totalSpent": 0
    }
  }
}
```

---

## Mutations

### **login**
Authenticate and get JWT token.

**Mutation:**
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      fullName
      phoneNumber
      role
      isVerifiedTenant
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "phoneNumber": "+6281234567892"
  }
}
```

**Response:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 3,
        "fullName": "Budi Santoso",
        "phoneNumber": "+6281234567892",
        "role": "TENANT",
        "isVerifiedTenant": true
      }
    }
  }
}
```

---

### **createBooking**
Create a new booking.

**Mutation:**
```graphql
mutation CreateBooking($input: CreateBookingInput!) {
  createBooking(input: $input) {
    id
    bookingDate
    startTime
    endTime
    status
    totalPrice
    user {
      fullName
    }
    facility {
      name
    }
  }
}
```

**Variables:**
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

**Response:**
```json
{
  "data": {
    "createBooking": {
      "id": 301,
      "bookingDate": "2026-01-22T00:00:00.000Z",
      "startTime": "14:00:00",
      "endTime": "15:00:00",
      "status": "PENDING",
      "totalPrice": 0,
      "user": {
        "fullName": "Budi Santoso"
      },
      "facility": {
        "name": "Tennis Court"
      }
    }
  }
}
```

**Error Response:**
```json
{
  "errors": [
    {
      "message": "Facility \"Tennis Court\" is already booked on 2026-01-22 at 14:00:00-15:00:00",
      "extensions": {
        "code": "BOOKING_CONFLICT",
        "statusCode": 409
      }
    }
  ]
}
```

---

### **confirmBooking**
Confirm a pending booking.

**Mutation:**
```graphql
mutation ConfirmBooking($id: Int!) {
  confirmBooking(id: $id) {
    id
    status
  }
}
```

**Variables:**
```json
{
  "id": 301
}
```

---

### **cancelBooking**
Cancel a booking.

**Mutation:**
```graphql
mutation CancelBooking($id: Int!) {
  cancelBooking(id: $id) {
    id
    status
  }
}
```

**Variables:**
```json
{
  "id": 301
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "errors": [
    {
      "message": "Error message",
      "extensions": {
        "code": "ERROR_CODE",
        "statusCode": 400
      }
    }
  ]
}
```

### Common Error Codes

- `UNAUTHENTICATED` - Not logged in
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `BOOKING_CONFLICT` - Time slot already booked
- `BOOKING_LIMIT_EXCEEDED` - Max 4 bookings per day reached
- `INVALID_TIME_SLOT` - Invalid time format or logic
- `FACILITY_CLOSED` - Booking outside operating hours

---

## Advanced Features

### DataLoader (N+1 Prevention)

When querying bookings with nested user/facility data, DataLoader automatically batches database queries:

```graphql
query GetUserBookings($userId: Int!) {
  userBookings(userId: $userId) {
    id
    user {        # ← DataLoader batches all user lookups
      fullName
    }
    facility {    # ← DataLoader batches all facility lookups
      name
    }
  }
}
```

**Without DataLoader:** 1 + N + N queries (1 booking query + N user queries + N facility queries)

**With DataLoader:** 1 + 2 queries (1 booking query + 1 batched user query + 1 batched facility query)

---

### Depth Limiting

Queries are limited to 7 levels of nesting to prevent abuse.

**This will be rejected:**
```graphql
query DeepQuery {
  userDashboard(userId: 1) {
    bookings {
      facility {
        # ... 8 more levels ... ❌
      }
    }
  }
}
```

---

## Testing Queries

Use the GraphQL Playground at `http://localhost:3002/` (development only).

Or use curl:

```bash
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "query { facilities { id name } }"
  }'
```