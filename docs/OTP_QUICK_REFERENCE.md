# 🔐 OTP Authentication - Quick Reference

## File Structure
```
weather/
├── src/
│   ├── lib/
│   │   └── auth.ts              ← OTP functions added
│   └── pages/
│       ├── LoginPage.tsx         ← Password/OTP toggle added
│       └── OTPVerificationPage.tsx ← NEW: OTP input form
├── server/
│   ├── index.js                 ← API endpoints added
│   └── otp-service.js           ← NEW: OTP logic
└── docs/
    ├── OTP_VERIFICATION_GUIDE.md ← Complete guide
    └── IMPLEMENTATION_SUMMARY.md ← Summary of changes
```

## 🔑 Key Functions

### Frontend (auth.ts)
```typescript
sendOTP(email, type)           // Generic OTP send
loginWithOTP(email)            // OTP login
registerWithOTP(name, email)   // OTP register
verifyOTP(email, otp, requestId) // Verify code
resendOTP(email, requestId)    // Resend code
sendVerificationEmail(email)   // Send verification
```

### Backend (otp-service.js)
```javascript
generateOTP()                  // Create 6-digit code
generateRequestId()            // Create request ID
sendOTPEmail(email, otp)       // Send email (mock)
createLoginOTP(email)          // OTP login flow
createRegistrationOTP(name, email) // OTP register flow
verifyOTPCode(requestId, code) // Verify code
resendOTPCode(requestId, email) // Resend code
```

## 🛣️ User Flow

```
┌─ Login/Register Page ─┐
│  - Password Tab       │
│  - OTP Tab ✨        │
└──────────┬────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
Password Tab   OTP Tab
    │             │
    │      Send OTP Code
    │             │
    │      ┌──────▼──────┐
    │      │ OTP Input    │
    │      │ 6 Digits     │
    │      │ Auto-Focus   │
    │      └──────┬──────┘
    │             │
    │      ┌──────▼──────────┐
    │      │ Verify OTP      │
    │      │ Generate Token  │
    │      └──────┬──────────┘
    │             │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Dashboard  │
    │  Logged In  │
    └─────────────┘
```

## 📡 API Endpoints

### Send OTP (Login)
```
POST /api/auth/login-otp
{ "email": "user@example.com" }
→ { "requestId": "req_..." }
```

### Send OTP (Register)
```
POST /api/auth/register-otp
{ "name": "John", "email": "user@example.com" }
→ { "requestId": "req_..." }
```

### Verify OTP
```
POST /api/auth/verify-otp
{ "email": "user@example.com", "otp": "123456", "requestId": "req_..." }
→ { "token": "jwt_token", "user": {...} }
```

### Resend OTP
```
POST /api/auth/resend-otp
{ "email": "user@example.com", "requestId": "req_..." }
→ { "message": "Sent" }
```

## ⚙️ Configuration

### OTP Settings (server/otp-service.js)
```javascript
const OTP_EXPIRY_TIME = 10 * 60 * 1000;  // 10 minutes
const MAX_OTP_ATTEMPTS = 3;               // 3 tries
// OTP Length: 6 digits (see generateOTP)
```

### Environment Variables (.env)
```env
SMTP_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password-from-google
SMTP_FROM=noreply@weather-app.com
```

## 🧪 Testing

### 1. Server Terminal - Check for OTP
```
[OTP] Sending login OTP to test@example.com: 123456
```

### 2. Browser - Enter OTP
- Input all 6 digits
- Click "Verify Email"

### 3. Result
- Token saved to localStorage
- Redirected to HomePage

## 🔧 Implementation Checklist

- [x] OTP generation function
- [x] Email template (mock)
- [x] Request ID tracking
- [x] OTP verification logic
- [x] Attempt limiting
- [x] Code expiration
- [x] Frontend UI components
- [x] API endpoints
- [ ] Real email service (Nodemailer/SendGrid)
- [ ] Database persistence
- [ ] Rate limiting middleware

## 🚀 To Enable Real Email

1. **Install Nodemailer:**
   ```bash
   npm install nodemailer
   ```

2. **Update sendOTPEmail() in otp-service.js:**
   ```javascript
   import nodemailer from 'nodemailer';
   
   const transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASSWORD
     }
   });
   
   async function sendOTPEmail(email, otp) {
     await transporter.sendMail({
       from: process.env.SMTP_FROM,
       to: email,
       subject: 'Your Verification Code',
       html: `<h1>${otp}</h1>`
     });
   }
   ```

3. **Set Gmail App Password:**
   - Google Account → Security → App Passwords
   - Select Mail + Computer
   - Copy 16-char password to `.env`

## 📊 Data Flow

```
Frontend                Backend                Database
─────────               ───────                ────────
User clicks OTP    →    generateOTP()    →    Store in Map
                        sendOTPEmail()   →    Send mock email
                        
User enters code   →    verifyOTPCode()  →    Check Map
                        generateJWT()    →    Create token
                        
Return token       ←    token            ←    Return to Frontend
```

## 🔒 Security Features

| Feature | Implementation | Level |
|---------|-----------------|-------|
| OTP Length | 6 digits | ~1M combinations |
| Expiration | 10 minutes | Automatic |
| Attempts | Max 3 | Rate limiting |
| Binding | requestId | Request-specific |
| Token | JWT | 30 days |
| Transport | HTTPS | Encrypted |

## ❌ Common Issues

| Issue | Solution |
|-------|----------|
| OTP not received | Use app password, check spam |
| "Code expired" | Resend OTP (10 min limit) |
| "Too many attempts" | Resend OTP (resets counter) |
| Token not saved | Check localStorage enabled |
| Email not sending | Verify SMTP_PASSWORD in .env |

## 📝 Code Examples

### Send OTP (Frontend)
```typescript
import { loginWithOTP } from '../lib/auth';

const result = await loginWithOTP('user@example.com');
if (result.success) {
  // Show OTP verification page
  setShowOtpVerification(true);
  setRequestId(result.requestId);
}
```

### Verify OTP (Frontend)
```typescript
import { verifyOTP } from '../lib/auth';

const result = await verifyOTP(email, '123456', requestId);
if (result.success) {
  localStorage.setItem('aurora-token', result.token);
  window.location.href = '/';
}
```

### Backend Endpoint
```javascript
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp, requestId } = req.body;
  const result = verifyOTPCode(requestId, otp);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }
  
  res.json({
    user: result.user,
    token: result.token
  });
});
```

## 📚 Additional Resources

- Full Guide: `docs/OTP_VERIFICATION_GUIDE.md`
- Summary: `docs/IMPLEMENTATION_SUMMARY.md`
- Main Readme: `README.md`

---

**Ready to use! Set up email service and you're done.** 🚀
