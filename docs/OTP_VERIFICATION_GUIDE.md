# 🔐 Gmail Verification & OTP Authentication Guide

## Overview

Your weather app now includes a **One-Time Password (OTP)** authentication system integrated with **Gmail verification** for secure, passwordless login and registration.

### Features

✅ **Passwordless Authentication** - Login without remembering passwords
✅ **Gmail Integration** - Send verification codes via email
✅ **OTP Verification** - 6-digit code sent to user email
✅ **Secure Token Generation** - JWT-based session tokens
✅ **Rate Limiting** - Maximum 3 OTP verification attempts
✅ **Code Expiration** - OTP codes expire after 10 minutes
✅ **Resend Functionality** - Allow users to resend codes
✅ **Email Verification** - Verify user email addresses

---

## 🏗️ Architecture

### Frontend Components

1. **LoginPage.tsx** - Enhanced with OTP/Password toggle
   - Supports both password-based and OTP-based authentication
   - Two auth modes: "Password" and "OTP"
   - Seamless switching between modes

2. **OTPVerificationPage.tsx** - Dedicated OTP input page
   - 6-digit input fields with auto-focus
   - Real-time countdown for resend button
   - Secure code display
   - Error handling and retry logic

### Backend Services

1. **otp-service.js** - Core OTP logic
   - Generate random 6-digit OTP
   - Store OTP with metadata (email, type, timestamp)
   - Verify OTP with attempt tracking
   - Manage user data

2. **server/index.js** - API endpoints
   - `/api/auth/login-otp` - Initiate login with OTP
   - `/api/auth/register-otp` - Register with OTP
   - `/api/auth/verify-otp` - Verify OTP code
   - `/api/auth/resend-otp` - Resend OTP
   - `/api/auth/send-verification-email` - Send verification email

### Authentication Flow

```
auth.ts (Client)
    ↓
    └─→ loginWithOTP(email)
            ↓
        /api/auth/login-otp (Server)
            ↓
        otp-service.js → generateOTP()
            ↓
        sendOTPEmail() → Email sent to user
            ↓
    OTPVerificationPage (Display 6-digit input)
            ↓
        verifyOTP(email, otp, requestId)
            ↓
        /api/auth/verify-otp (Server)
            ↓
        otp-service.js → verifyOTPCode()
            ↓
        User verified → Generate JWT token
            ↓
    Return token → Store in localStorage
            ↓
    Redirect to HomePage
```

---

## 🚀 How to Use

### For Users

#### **Option 1: OTP-based Login (Recommended)**

1. Go to Login page
2. Click the **"OTP"** tab (instead of "Password")
3. Enter your email address
4. Click **"Send verification code"**
5. Check your email for 6-digit code
6. Enter all 6 digits (auto-focus enabled)
7. Click **"Verify Email"**
8. Success! You're logged in

#### **Option 2: OTP-based Registration**

1. Go to Login page
2. Click **"Register"** tab
3. Click the **"OTP"** tab
4. Enter your name and email
5. Click **"Send verification code"**
6. Check your email and enter the 6-digit code
7. Click **"Verify Email"**
8. Success! Account created

#### **Option 3: Traditional Password (Still Available)**

1. Go to Login page
2. Keep **"Password"** tab selected
3. Enter email and password
4. Click **"Login"** or **"Create account"**

#### **Resending Code**

- Click **"Resend Code"** button (60-second cooldown)
- New OTP sent to your email
- Old code becomes invalid

---

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:

```env
# Email Service (Nodemailer)
SMTP_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@weather-app.com

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_TIME=600000  # 10 minutes in milliseconds
OTP_MAX_ATTEMPTS=3
```

### Gmail Setup (for sending OTP emails)

1. **Enable 2-Factor Authentication** in your Google Account
2. **Create App Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer" (or your setup)
   - Google generates a 16-character password
   - Use this password in `SMTP_PASSWORD`

3. **Update .env**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

---

## 🔌 API Endpoints

### 1. Login with OTP
```
POST /api/auth/login-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent to user@example.com",
  "requestId": "req_1234567890_abcdef123"
}
```

### 2. Register with OTP
```
POST /api/auth/register-otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Registration code sent to user@example.com",
  "requestId": "req_1234567890_abcdef123"
}
```

### 3. Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "requestId": "req_1234567890_abcdef123"
}

Response:
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "user@example.com",
    "name": "John Doe",
    "email": "user@example.com",
    "emailVerified": true
  },
  "token": "eyJhbGc..."
}
```

### 4. Resend OTP
```
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "requestId": "req_1234567890_abcdef123"
}

Response:
{
  "success": true,
  "message": "New OTP sent to your email"
}
```

### 5. Send Verification Email
```
POST /api/auth/send-verification-email
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Verification email sent to user@example.com",
  "requestId": "req_1234567890_abcdef123"
}
```

---

## 📝 Auth Module Functions

### In `src/lib/auth.ts`

```typescript
// Send OTP to email
sendOTP(email: string, type?: 'login' | 'register' | 'verification'): Promise<OTPResponse>

// Verify OTP code
verifyOTP(email: string, otp: string, requestId: string): Promise<OTPVerificationResponse>

// Register with OTP
registerWithOTP(name: string, email: string): Promise<OTPResponse>

// Login with OTP
loginWithOTP(email: string): Promise<OTPResponse>

// Resend OTP
resendOTP(email: string, requestId: string): Promise<OTPResponse>

// Send verification email
sendVerificationEmail(email: string): Promise<OTPResponse>
```

---

## 🛡️ Security Features

### OTP Security

✅ **6-Digit Random Code** - ~1 million combinations
✅ **10-Minute Expiration** - Codes expire automatically
✅ **Attempt Limiting** - Max 3 verification attempts
✅ **Request Tracking** - Each OTP tied to unique requestId
✅ **Email Verification** - Only email-verified users can access

### Token Security

✅ **JWT Tokens** - Cryptographically signed
✅ **30-Day Expiration** - Auto-logout after 30 days
✅ **HttpOnly Cookies** (optional) - Can be stored securely
✅ **HTTPS Required** (production) - Encrypted transmission

### Best Practices

- **Never expose OTP in logs** - Remove for production
- **Use HTTPS only** - Secure token transmission
- **Rate limit endpoints** - Prevent brute force
- **Validate emails** - Check email format
- **Use real email service** - Replace mock with Nodemailer/SendGrid

---

## 🔄 Integrating Real Email Service

### Option 1: Nodemailer (Recommended)

```bash
npm install nodemailer
```

Update `server/otp-service.js`:

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

async function sendOTPEmail(email, otp, type = 'login') {
  const subject = type === 'login' 
    ? 'Your Weather App Login Code' 
    : 'Verify Your Weather App Email';

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@weather-app.com',
    to: email,
    subject: subject,
    html: `
      <h2>Verification Code</h2>
      <p>Your ${type} verification code is:</p>
      <h1 style="font-size: 36px; letter-spacing: 5px;">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
      <p>Never share this code with anyone.</p>
    `
  });
}
```

### Option 2: SendGrid

```bash
npm install @sendgrid/mail
```

Update `server/otp-service.js`:

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOTPEmail(email, otp, type = 'login') {
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM,
    subject: `Your Weather App ${type === 'login' ? 'Login' : 'Verification'} Code`,
    html: `<h1>${otp}</h1>`
  });
}
```

---

## 🧪 Testing

### Manual Testing

1. **Test OTP Generation**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Check Console** for generated OTP
   ```
   [OTP] Sending login OTP to test@example.com: 123456
   ```

3. **Verify OTP**
   ```bash
   curl -X POST http://localhost:3001/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{
       "email":"test@example.com",
       "otp":"123456",
       "requestId":"req_..."
     }'
   ```

### Automated Testing

```typescript
describe('OTP Authentication', () => {
  it('should send OTP to email', async () => {
    const response = await fetch('/api/auth/login-otp', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' })
    });
    expect(response.status).toBe(200);
    expect(response.json()).toHaveProperty('requestId');
  });

  it('should verify valid OTP', async () => {
    // ... implement test
  });
});
```

---

## 📊 Database Schema (Future Enhancement)

When moving to a real database, use this schema:

```sql
-- OTP Verification Codes
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type ENUM('login', 'register', 'verification'),
  attempts INT DEFAULT 0,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE
);

-- User Accounts
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User Sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  token VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 🐛 Troubleshooting

### "OTP sent to email" but no email received

- Check email spam/junk folder
- Verify SMTP credentials in `.env`
- Check console for errors
- Ensure Gmail app password is correct

### "OTP has expired"

- OTP codes expire after 10 minutes
- Click "Resend Code" to get a new one
- Try again with fresh code

### "Too many failed attempts"

- You've entered wrong OTP 3 times
- Click "Resend Code" to request a new OTP
- New OTP resets the attempt counter

### Token not working

- Check if token is stored in localStorage
- Verify token format (should start with `req_` or be JWT)
- Check browser console for errors
- Clear localStorage and re-login

---

## 📚 References

- [OTP Standards (RFC 4226)](https://tools.ietf.org/html/rfc4226)
- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## 🚀 Next Steps

1. **Install email service** (Nodemailer/SendGrid)
2. **Set up Gmail app password**
3. **Add environment variables**
4. **Update `.env` file**
5. **Test OTP flow** manually
6. **Deploy to production**

---

**Your weather app is now more secure with Gmail-verified OTP authentication! 🔐**
