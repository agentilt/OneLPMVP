# OneLPM iOS App - API Testing Guide

This guide provides example API requests you can use to test the backend before/during iOS development.

## 🚀 Setup

### Start Backend
```bash
cd /path/to/OneLPMVP
npm run dev
# Backend runs at http://localhost:3000
```

### Test Credentials
```
Admin: admin@eurolp.com / SecurePassword123!
Demo User: demo@eurolp.com / demo123
```

---

## 🔐 Authentication

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@eurolp.com",
    "password": "demo123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "demo@eurolp.com",
    "name": "Demo User",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token for subsequent requests!**

---

### 2. Validate Invitation Token
```bash
curl http://localhost:3000/api/invitations/validate?token=YOUR_TOKEN_HERE
```

**Expected Response (Valid):**
```json
{
  "valid": true,
  "email": "newuser@example.com"
}
```

**Expected Response (Invalid):**
```json
{
  "valid": false,
  "error": "Invalid or expired invitation token"
}
```

---

### 3. Register New User
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invitation-token-here",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "clx...",
    "email": "newuser@example.com",
    "name": "John Doe"
  }
}
```

---

### 4. Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@eurolp.com"
  }'
```

**Expected Response:**
```json
{
  "message": "Password reset email sent"
}
```

---

## 📊 Dashboard & Portfolio

### Get Dashboard Data
```bash
# Replace YOUR_JWT_TOKEN with the token from login
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "portfolioSummary": {
    "totalCommitment": 5000000.0,
    "totalNav": 6500000.0,
    "portfolioTvpi": 1.3,
    "activeCapitalCalls": 2
  },
  "funds": [
    {
      "id": "fund1",
      "name": "Tech Ventures Fund I",
      "domicile": "Luxembourg",
      "vintage": 2020,
      "manager": "Acme Capital",
      "commitment": 1000000.0,
      "paidIn": 800000.0,
      "nav": 950000.0,
      "irr": 0.15,
      "tvpi": 1.19,
      "dpi": 0.05,
      "lastReportDate": "2024-12-31T00:00:00.000Z",
      "navHistory": [
        {
          "id": "nh1",
          "date": "2023-12-31T00:00:00.000Z",
          "nav": 850000.0
        },
        {
          "id": "nh2",
          "date": "2024-06-30T00:00:00.000Z",
          "nav": 900000.0
        },
        {
          "id": "nh3",
          "date": "2024-12-31T00:00:00.000Z",
          "nav": 950000.0
        }
      ]
    }
  ],
  "cryptoHoldings": [
    {
      "id": "ch1",
      "symbol": "BTC",
      "name": "Bitcoin",
      "amount": 0.5,
      "valueUsd": 25000.0
    },
    {
      "id": "ch2",
      "symbol": "ETH",
      "name": "Ethereum",
      "amount": 10.0,
      "valueUsd": 20000.0
    }
  ]
}
```

---

## 💼 Funds

### List All Funds
```bash
curl http://localhost:3000/api/funds \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "funds": [
    {
      "id": "fund1",
      "name": "Tech Ventures Fund I",
      "domicile": "Luxembourg",
      "vintage": 2020,
      "manager": "Acme Capital",
      "commitment": 1000000.0,
      "paidIn": 800000.0,
      "nav": 950000.0,
      "irr": 0.15,
      "tvpi": 1.19,
      "dpi": 0.05,
      "lastReportDate": "2024-12-31T00:00:00.000Z",
      "navHistory": [
        // ... NAV history array
      ]
    },
    // ... more funds
  ]
}
```

---

### Get Fund Details
```bash
# Replace FUND_ID with actual fund ID
curl http://localhost:3000/api/funds/FUND_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "fund": {
    "id": "fund1",
    "name": "Tech Ventures Fund I",
    "domicile": "Luxembourg",
    "vintage": 2020,
    "manager": "Acme Capital",
    "commitment": 1000000.0,
    "paidIn": 800000.0,
    "nav": 950000.0,
    "irr": 0.15,
    "tvpi": 1.19,
    "dpi": 0.05,
    "lastReportDate": "2024-12-31T00:00:00.000Z",
    "navHistory": [
      {
        "id": "nh1",
        "date": "2023-12-31T00:00:00.000Z",
        "nav": 850000.0
      }
    ],
    "documents": [
      {
        "id": "doc1",
        "type": "CAPITAL_CALL",
        "title": "Capital Call #5",
        "uploadDate": "2025-01-15T00:00:00.000Z",
        "dueDate": "2025-02-15T00:00:00.000Z",
        "callAmount": 50000.0,
        "paymentStatus": "PENDING",
        "url": "/uploads/documents/doc1.pdf",
        "parsedData": {
          "callNumber": "5",
          "percentage": "5%"
        }
      },
      {
        "id": "doc2",
        "type": "QUARTERLY_REPORT",
        "title": "Q4 2024 Report",
        "uploadDate": "2025-01-10T00:00:00.000Z",
        "dueDate": null,
        "callAmount": null,
        "paymentStatus": null,
        "url": "/uploads/documents/doc2.pdf",
        "parsedData": null
      }
    ]
  }
}
```

---

## 💰 Cryptocurrency

### Get Crypto Holdings
```bash
curl http://localhost:3000/api/crypto \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "holdings": [
    {
      "id": "ch1",
      "symbol": "BTC",
      "name": "Bitcoin",
      "amount": 0.5,
      "valueUsd": 25000.0
    },
    {
      "id": "ch2",
      "symbol": "ETH",
      "name": "Ethereum",
      "amount": 10.0,
      "valueUsd": 20000.0
    }
  ],
  "totalValue": 45000.0
}
```

---

## 👤 User Profile

### Get User Profile
```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "user": {
    "id": "user1",
    "email": "demo@eurolp.com",
    "firstName": "Demo",
    "lastName": "User",
    "name": "Demo User",
    "role": "USER",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}
```

---

## 🧪 Testing Tips

### Save Token for Reuse
```bash
# Login and save token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@eurolp.com","password":"demo123"}' \
  | jq -r '.token')

echo $TOKEN

# Use token in subsequent requests
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Pretty Print JSON with jq
```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Check HTTP Status Code
```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Test Invalid Token (Should return 401)
```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer invalid-token-here"
```

---

## 🔍 Common Error Responses

### 401 Unauthorized (Missing or Invalid Token)
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request (Invalid Input)
```json
{
  "error": "Invalid email or password"
}
```

### 404 Not Found (Resource Doesn't Exist)
```json
{
  "error": "Fund not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 📱 iOS Testing

### Test from iOS Simulator
When testing from iOS Simulator, use:
- **Localhost:** `http://localhost:3000`
- **OR:** `http://127.0.0.1:3000`

### Test from Physical Device
When testing from a physical iPhone/iPad on the same network:
1. Find your Mac's local IP: `ifconfig | grep inet`
2. Use: `http://YOUR_IP:3000` (e.g., `http://192.168.1.100:3000`)

---

## 🔄 Postman Collection (Optional)

### Create Postman Collection

1. **Create Environment Variables:**
   - `baseUrl`: `http://localhost:3000`
   - `token`: (will be set after login)

2. **Create Requests:**

#### Login
```
POST {{baseUrl}}/api/auth/callback/credentials
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "demo@eurolp.com",
  "password": "demo123"
}

Tests (save token):
pm.environment.set("token", pm.response.json().token);
```

#### Get Dashboard
```
GET {{baseUrl}}/api/dashboard
Headers: 
  Authorization: Bearer {{token}}
```

#### Get Funds
```
GET {{baseUrl}}/api/funds
Headers: 
  Authorization: Bearer {{token}}
```

---

## 🛠️ Development Workflow

### Typical Testing Flow

1. **Start Backend:**
   ```bash
   npm run dev
   ```

2. **Login & Get Token:**
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@eurolp.com","password":"demo123"}' \
     | jq -r '.token')
   ```

3. **Test Dashboard:**
   ```bash
   curl http://localhost:3000/api/dashboard \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

4. **Test Funds:**
   ```bash
   curl http://localhost:3000/api/funds \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

5. **Test Fund Detail:**
   ```bash
   # Get fund ID from funds list
   FUND_ID=$(curl -s http://localhost:3000/api/funds \
     -H "Authorization: Bearer $TOKEN" | jq -r '.funds[0].id')
   
   curl http://localhost:3000/api/funds/$FUND_ID \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

6. **Test Crypto:**
   ```bash
   curl http://localhost:3000/api/crypto \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

---

## 📝 Mock Data for Development

If the backend returns empty data, you can create mock data:

### Create Mock Fund (Admin Only)
```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eurolp.com","password":"SecurePassword123!"}' \
  | jq -r '.token')

# Create fund
curl -X POST http://localhost:3000/api/admin/funds \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Venture Fund",
    "domicile": "Luxembourg",
    "vintage": 2024,
    "manager": "Test Capital",
    "commitment": 1000000,
    "paidIn": 500000,
    "nav": 550000,
    "irr": 0.10,
    "tvpi": 1.1,
    "dpi": 0.05,
    "lastReportDate": "2024-12-31"
  }'
```

---

## 🔒 Security Testing

### Test Token Expiration
```bash
# Use an old/expired token
curl -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer expired-token"

# Should return 401 Unauthorized
```

### Test Missing Authorization Header
```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:3000/api/dashboard

# Should return 401 Unauthorized
```

### Test Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@example.com",
    "password": "wrongpass"
  }'

# Should return error
```

---

## 📊 Response Time Testing

### Test Response Time
```bash
curl -w "\nTime Total: %{time_total}s\n" \
  -o /dev/null -s \
  http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Benchmark Multiple Requests
```bash
for i in {1..10}; do
  curl -w "Request $i: %{time_total}s\n" \
    -o /dev/null -s \
    http://localhost:3000/api/dashboard \
    -H "Authorization: Bearer $TOKEN"
done
```

---

## 🐛 Debugging

### Verbose Output
```bash
curl -v http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Include Response Headers
```bash
curl -i http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Save Response to File
```bash
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -o dashboard_response.json
```

---

## ✅ Checklist

Before starting iOS development, verify:

- [ ] Backend is running (`npm run dev`)
- [ ] Can login successfully
- [ ] Dashboard endpoint returns data
- [ ] Funds endpoint returns data
- [ ] Fund detail endpoint works
- [ ] Crypto endpoint returns data (or empty array)
- [ ] User profile endpoint works
- [ ] 401 is returned for invalid tokens
- [ ] All dates are in ISO 8601 format
- [ ] All amounts are numbers (not strings)

---

## 📞 Support

If you encounter API issues:

1. Check backend logs in the terminal
2. Verify database is running and seeded
3. Check `prisma/schema.prisma` for data structure
4. Review API route files in `src/app/api/`
5. Test with Postman/curl to isolate iOS issues

---

**Happy Testing! 🚀**

