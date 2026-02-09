# REST API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### **Authentication**

#### `POST /auth/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "phoneNumber": "+6281234567892"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "fullName": "Budi Santoso",
    "phoneNumber": "+6281234567892",
    "role": "tenant",
    "isVerifiedTenant": true,
    "unitNumber": "1703",
    "createdAt": "2026-01-21T...",
    "updatedAt": "2026-01-21T..."
  }
}
```

---

#### `GET /auth/me`
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 3,
  "fullName": "Budi Santoso",
  "phoneNumber": "+6281234567892",
  "role": "tenant",
  "isVerifiedTenant": true,
  "unitNumber": "1703",
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T..."
}
```

---

### **Facilities**

#### `GET /facilities`
Get all active facilities.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Tennis Court",
    "description": "Outdoor tennis court...",
    "pricePerHour": 50000,
    "openTime": "06:00:00",
    "closeTime": "22:00:00",
    "isActive": true,
    "createdAt": "2026-01-21T...",
    "updatedAt": "2026-01-21T..."
  }
]
```

---

#### `GET /facilities/:id`
Get facility by ID.

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Tennis Court",
  "description": "Outdoor tennis court...",
  "pricePerHour": 50000,
  "openTime": "06:00:00",
  "closeTime": "22:00:00",
  "isActive": true,
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T..."
}
```

**Error:** `404 Not Found`
```json
{
  "error": "NotFoundError",
  "message": "Facility with id 999 not found",
  "code": "NOT_FOUND"
}
```

---

#### `GET /facilities/:id/slots?date=YYYY-MM-DD`
Get available time slots for a facility on a specific date.

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Example:** `GET /facilities/1/slots?date=2026-01-22`

**Response:** `200 OK`
```json
{
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
    },
    {
      "startTime": "08:00:00",
      "endTime": "09:00:00",
      "isAvailable": true
    }
  ]
}
```

---

### **Bookings**

#### `POST /bookings`
Create a new booking.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": 3,
  "facilityId": 1,
  "bookingDate": "2026-01-22",
  "startTime": "14:00:00",
  "endTime": "15:00:00"
}
```

**Response:** `201 Created`
```json
{
  "id": 301,
  "userId": 3,
  "facilityId": 1,
  "bookingDate": "2026-01-22T00:00:00.000Z",
  "startTime": "14:00:00",
  "endTime": "15:00:00",
  "status": "pending",
  "totalPrice": 0,
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T..."
}
```

**Errors:**

**Conflict:** `409 Conflict`
```json
{
  "error": "BookingConflictError",
  "message": "Facility \"Tennis Court\" is already booked on 2026-01-22 at 14:00:00-15:00:00",
  "code": "BOOKING_CONFLICT"
}
```

**Daily Limit:** `409 Conflict`
```json
{
  "error": "BookingLimitExceededError",
  "message": "You have reached the maximum of 4 bookings per day",
  "code": "BOOKING_LIMIT_EXCEEDED"
}
```

**Validation Error:** `400 Bad Request`
```json
{
  "error": "ValidationError",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "fields": {
    "startTime": "Invalid time format. Use HH:MM or HH:MM:SS"
  }
}
```

---

#### `GET /bookings/:id`
Get booking by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 301,
  "userId": 3,
  "facilityId": 1,
  "bookingDate": "2026-01-22T00:00:00.000Z",
  "startTime": "14:00:00",
  "endTime": "15:00:00",
  "status": "confirmed",
  "totalPrice": 0,
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T..."
}
```

---

#### `GET /bookings/:id/details`
Get booking with full details (includes user and facility).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 301,
  "userId": 3,
  "facilityId": 1,
  "bookingDate": "2026-01-22T00:00:00.000Z",
  "startTime": "14:00:00",
  "endTime": "15:00:00",
  "status": "confirmed",
  "totalPrice": 0,
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T...",
  "user": {
    "id": 3,
    "fullName": "Budi Santoso",
    "phoneNumber": "+6281234567892",
    "role": "tenant",
    "isVerifiedTenant": true,
    "unitNumber": "1703",
    "createdAt": "2026-01-21T...",
    "updatedAt": "2026-01-21T..."
  },
  "facility": {
    "id": 1,
    "name": "Tennis Court",
    "description": "Outdoor tennis court...",
    "pricePerHour": 50000,
    "openTime": "06:00:00",
    "closeTime": "22:00:00",
    "isActive": true,
    "createdAt": "2026-01-21T...",
    "updatedAt": "2026-01-21T..."
  }
}
```

---

#### `PUT /bookings/:id/confirm`
Confirm a booking.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 301,
  "userId": 3,
  "facilityId": 1,
  "bookingDate": "2026-01-22T00:00:00.000Z",
  "startTime": "14:00:00",
  "endTime": "15:00:00",
  "status": "confirmed",
  "totalPrice": 0,
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T..."
}
```

---

#### `DELETE /bookings/:id`
Cancel a booking.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 301,
  "userId": 3,
  "facilityId": 1,
  "bookingDate": "2026-01-22T00:00:00.000Z",
  "startTime": "14:00:00",
  "endTime": "15:00:00",
  "status": "cancelled",
  "totalPrice": 0,
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T..."
}
```

---

### **Users**

#### `GET /users/:id`
Get user by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 3,
  "fullName": "Budi Santoso",
  "phoneNumber": "+6281234567892",
  "role": "tenant",
  "isVerifiedTenant": true,
  "unitNumber": "1703",
  "createdAt": "2026-01-21T...",
  "updatedAt": "2026-01-21T..."
}
```

---

#### `GET /users/:id/bookings`
Get all bookings for a user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": 301,
    "userId": 3,
    "facilityId": 1,
    "bookingDate": "2026-01-22T00:00:00.000Z",
    "startTime": "14:00:00",
    "endTime": "15:00:00",
    "status": "confirmed",
    "totalPrice": 0,
    "createdAt": "2026-01-21T...",
    "updatedAt": "2026-01-21T...",
    "user": { ... },
    "facility": { ... }
  }
]
```

---

#### `GET /users/:id/dashboard`
Get user dashboard with bookings and statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": {
    "id": 3,
    "fullName": "Budi Santoso",
    "phoneNumber": "+6281234567892",
    "role": "tenant",
    "isVerifiedTenant": true,
    "unitNumber": "1703",
    "createdAt": "2026-01-21T...",
    "updatedAt": "2026-01-21T..."
  },
  "bookings": [ ... ],
  "bookingCountToday": 1,
  "upcomingBookings": 3,
  "totalSpent": 0
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business rule violation (conflict, limit exceeded)
- `500 Internal Server Error` - Server error