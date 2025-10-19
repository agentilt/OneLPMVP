# Mobile API Endpoints for iOS App Integration

This document contains all the necessary API endpoints for your iOS app to connect to the existing EuroLP backend.

## Base URL
```
https://your-domain.com/api/mobile
```

## Authentication Endpoints

### 1. User Login
**Endpoint:** `POST /api/mobile/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 2592000
  },
  "error": null,
  "message": "Login successful"
}
```

**Response (Error):**
```json
{
  "success": false,
  "data": null,
  "error": "Invalid credentials",
  "message": "Email or password is incorrect"
}
```

### 2. User Registration
**Endpoint:** `POST /api/mobile/auth/register`

**Request Body:**
```json
{
  "token": "invitation_token",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "expiresIn": 2592000
  },
  "error": null,
  "message": "Registration successful"
}
```

### 3. Refresh Token
**Endpoint:** `POST /api/mobile/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "refreshToken": "new_refresh_token_here",
    "expiresIn": 2592000
  },
  "error": null,
  "message": "Token refreshed successfully"
}
```

### 4. Logout
**Endpoint:** `POST /api/mobile/auth/logout`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (Success):**
```json
{
  "success": true,
  "data": null,
  "error": null,
  "message": "Logout successful"
}
```

### 5. Request Password Reset
**Endpoint:** `POST /api/mobile/auth/request-password-reset`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": null,
  "error": null,
  "message": "Password reset instructions have been sent to your email"
}
```

### 6. Reset Password
**Endpoint:** `POST /api/mobile/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": null,
  "error": null,
  "message": "Password reset successfully"
}
```

## User Profile Endpoints

### 7. Get User Profile
**Endpoint:** `GET /api/mobile/user/profile`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "emailVerified": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "error": null,
  "message": "Profile retrieved successfully"
}
```

### 8. Update User Profile
**Endpoint:** `PUT /api/mobile/user/profile`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    }
  },
  "error": null,
  "message": "Profile updated successfully"
}
```

## Fund Management Endpoints

### 9. Get User's Funds
**Endpoint:** `GET /api/mobile/user/funds`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "funds": [
      {
        "id": "fund_id",
        "name": "Fund Name",
        "domicile": "Luxembourg",
        "vintage": 2023,
        "manager": "Fund Manager",
        "commitment": 1000000,
        "paidIn": 500000,
        "nav": 550000,
        "irr": 0.1,
        "tvpi": 1.1,
        "dpi": 0.5,
        "lastReportDate": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "error": null,
  "message": "Funds retrieved successfully"
}
```

### 10. Get Fund Details
**Endpoint:** `GET /api/mobile/funds/{fundId}`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "fund": {
      "id": "fund_id",
      "name": "Fund Name",
      "domicile": "Luxembourg",
      "vintage": 2023,
      "manager": "Fund Manager",
      "commitment": 1000000,
      "paidIn": 500000,
      "nav": 550000,
      "irr": 0.1,
      "tvpi": 1.1,
      "dpi": 0.5,
      "lastReportDate": "2024-01-01T00:00:00.000Z",
      "navHistory": [
        {
          "id": "nav_id",
          "date": "2024-01-01T00:00:00.000Z",
          "nav": 550000
        }
      ]
    }
  },
  "error": null,
  "message": "Fund details retrieved successfully"
}
```

### 11. Get Fund Documents
**Endpoint:** `GET /api/mobile/funds/{fundId}/documents`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Query Parameters:**
- `type` (optional): Filter by document type (CAPITAL_CALL, QUARTERLY_REPORT, ANNUAL_REPORT, KYC, COMPLIANCE, OTHER)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_id",
        "type": "QUARTERLY_REPORT",
        "title": "Q1 2024 Report",
        "uploadDate": "2024-01-01T00:00:00.000Z",
        "dueDate": "2024-01-15T00:00:00.000Z",
        "callAmount": 100000,
        "paymentStatus": "PENDING",
        "url": "/uploads/documents/filename.pdf",
        "investmentValue": 50000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  },
  "error": null,
  "message": "Documents retrieved successfully"
}
```

## File Upload Endpoint

### 12. Upload Document
**Endpoint:** `POST /api/mobile/upload`

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: The file to upload (PDF, Excel, CSV)
- `fundId`: ID of the fund this document belongs to
- `type`: Document type (CAPITAL_CALL, QUARTERLY_REPORT, ANNUAL_REPORT, KYC, COMPLIANCE, OTHER)
- `title`: Document title
- `dueDate` (optional): Due date in ISO format
- `callAmount` (optional): Call amount for capital calls
- `investmentValue` (optional): Investment value

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_id",
      "type": "QUARTERLY_REPORT",
      "title": "Q1 2024 Report",
      "uploadDate": "2024-01-01T00:00:00.000Z",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "callAmount": 100000,
      "paymentStatus": "PENDING",
      "url": "/uploads/documents/filename.pdf",
      "investmentValue": 50000
    }
  },
  "error": null,
  "message": "Document uploaded successfully"
}
```

## Crypto Holdings Endpoints

### 13. Get Crypto Holdings
**Endpoint:** `GET /api/mobile/crypto/holdings`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "id": "holding_id",
        "symbol": "BTC",
        "name": "Bitcoin",
        "amount": 0.5,
        "valueUsd": 25000,
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "error": null,
  "message": "Crypto holdings retrieved successfully"
}
```

### 14. Update Crypto Holdings
**Endpoint:** `PUT /api/mobile/crypto/holdings`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "holdings": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "amount": 0.5,
      "valueUsd": 25000
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "id": "holding_id",
        "symbol": "BTC",
        "name": "Bitcoin",
        "amount": 0.5,
        "valueUsd": 25000,
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "error": null,
  "message": "Crypto holdings updated successfully"
}
```

## Error Handling

All endpoints return consistent error responses:

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "success": false,
  "data": null,
  "error": "Error message",
  "message": "Human readable error message"
}
```

## Authentication

- All protected endpoints require the `Authorization: Bearer <token>` header
- JWT tokens expire after 30 days
- Use refresh tokens to get new access tokens
- Store tokens securely in iOS Keychain

## Rate Limiting

- Login attempts: 5 per minute per IP
- API calls: 100 per minute per user
- File uploads: 10 per minute per user

## File Upload Limits

- Maximum file size: 10MB
- Allowed file types: PDF, Excel (.xlsx, .xls), CSV
- Files are stored in `/public/uploads/documents/`

## Implementation Notes

1. **Base URL**: Replace `https://your-domain.com` with your actual backend URL
2. **JWT Secret**: Use the same `NEXTAUTH_SECRET` from your backend
3. **Database**: All endpoints use the existing Prisma schema
4. **CORS**: Configure CORS to allow your iOS app domain
5. **Rate Limiting**: Implement rate limiting middleware
6. **Validation**: Use Zod schemas for request validation
7. **Error Logging**: Log all errors for debugging

## Next Steps

1. Create the mobile API directory structure in your Next.js project
2. Implement each endpoint using the existing Prisma models
3. Add JWT token generation and validation
4. Configure CORS for your iOS app
5. Test all endpoints with Postman or similar tool
6. Integrate with your iOS app using URLSession or Alamofire
