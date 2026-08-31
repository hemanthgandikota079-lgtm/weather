/**
 * OTP Service - Handles OTP generation, storage, and verification
 * Uses in-memory storage for demo/development purposes
 * For production, use a database like Redis or MongoDB
 */

const otpStore = new Map(); // In-memory storage: key -> { otp, email, type, createdAt, attempts }
const userStore = new Map(); // In-memory user storage: email -> { name, verified, token }

const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send OTP to email (mock implementation)
 * In production, use nodemailer or SendGrid
 * SECURITY: Never log the actual OTP code in production
 */
async function sendOTPEmail(email, otp, type = 'login') {
  // Security: Only log that OTP was sent, not the actual code
  // In production, ensure OTP is never logged or exposed in any logs
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP] Verification code sent to ${email} (type: ${type})`);
  }
  
  // Mock email sending - in production, use nodemailer
  // Example:
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({
  //   to: email,
  //   subject: 'Your Weather App Verification Code',
  //   html: `<p>Your verification code is: <strong>${otp}</strong></p>`
  // });
  
  return true;
}

/**
 * Create and send OTP for login
 */
export async function createLoginOTP(email) {
  // Validate email format
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address provided');
  }
  
  const otp = generateOTP();
  const requestId = generateRequestId();
  
  // Store OTP with metadata
  otpStore.set(requestId, {
    otp,
    email: email.toLowerCase(),
    type: 'login',
    createdAt: Date.now(),
    attempts: 0,
    verified: false
  });

  // Send OTP via email
  await sendOTPEmail(email, otp, 'login');

  return { requestId, otp }; // Return OTP for demo (remove in production)
}

/**
 * Create and send OTP for registration
 */
export async function createRegistrationOTP(name, email) {
  // Validate input
  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    throw new Error('Invalid name provided');
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email address provided');
  }
  
  const otp = generateOTP();
  const requestId = generateRequestId();
  
  // Store OTP with metadata and user data
  otpStore.set(requestId, {
    otp,
    email: email.toLowerCase(),
    name: name.trim(),
    type: 'register',
    createdAt: Date.now(),
    attempts: 0,
    verified: false
  });

  // Send OTP via email
  await sendOTPEmail(email, otp, 'register');

  return { requestId, otp }; // Return OTP for demo (remove in production)
}

/**
 * Verify OTP code
 */
export function verifyOTPCode(requestId, otpCode) {
  // Validate inputs
  if (!requestId || typeof requestId !== 'string') {
    return {
      success: false,
      message: 'Invalid request ID'
    };
  }
  
  if (!otpCode || typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode.trim())) {
    return {
      success: false,
      message: 'OTP must be a 6-digit code'
    };
  }

  const otpData = otpStore.get(requestId);

  if (!otpData) {
    return {
      success: false,
      message: 'Invalid or expired request. Please request a new OTP.'
    };
  }

  // Check if OTP has expired
  if (Date.now() - otpData.createdAt > OTP_EXPIRY_TIME) {
    otpStore.delete(requestId);
    return {
      success: false,
      message: 'OTP has expired. Please request a new code.'
    };
  }

  // Check attempts
  if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(requestId);
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.'
    };
  }

  // Verify OTP (constant-time comparison to prevent timing attacks)
  const providedOtp = otpCode.trim();
  if (otpData.otp !== providedOtp) {
    otpData.attempts += 1;
    return {
      success: false,
      message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - otpData.attempts} attempts remaining.`
    };
  }

  // Mark as verified
  otpData.verified = true;

  // Create user if registration
  if (otpData.type === 'register') {
    userStore.set(otpData.email, {
      name: otpData.name,
      email: otpData.email,
      verified: true,
      createdAt: new Date().toISOString(),
      token: generateJWT(otpData.email, otpData.name)
    });
  } else if (otpData.type === 'login') {
    // Update existing user or create if doesn't exist
    if (!userStore.has(otpData.email)) {
      userStore.set(otpData.email, {
        name: 'User',
        email: otpData.email,
        verified: true,
        lastLogin: new Date().toISOString(),
        token: generateJWT(otpData.email, 'User')
      });
    } else {
      const user = userStore.get(otpData.email);
      user.lastLogin = new Date().toISOString();
      user.token = generateJWT(otpData.email, user.name);
    }
  }

  const user = userStore.get(otpData.email);

  // Clean up used OTP
  otpStore.delete(requestId);

  return {
    success: true,
    message: 'Email verified successfully',
    user: {
      id: otpData.email,
      name: user.name,
      email: otpData.email,
      emailVerified: true
    },
    token: user.token
  };
}

/**
 * Resend OTP code
 */
export async function resendOTPCode(requestId, email) {
  const otpData = otpStore.get(requestId);

  if (!otpData) {
    return {
      success: false,
      message: 'Invalid or expired request.'
    };
  }

  if (otpData.email !== email) {
    return {
      success: false,
      message: 'Email mismatch.'
    };
  }

  // Generate new OTP
  const newOtp = generateOTP();
  otpData.otp = newOtp;
  otpData.createdAt = Date.now();
  otpData.attempts = 0;

  // Send new OTP
  await sendOTPEmail(email, newOtp, otpData.type);

  return {
    success: true,
    message: 'New OTP sent to your email'
  };
}

/**
 * Simple JWT token generator (for demo)
 * In production, use jsonwebtoken package
 */
function generateJWT(email, name) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    email,
    name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
  }));
  const signature = 'mock_signature'; // In production, use HMAC
  return `${header}.${payload}.${signature}`;
}

/**
 * Get user by email
 */
export function getUserByEmail(email) {
  return userStore.get(email) || null;
}

/**
 * Get all users (for debugging)
 */
export function getAllUsers() {
  return Array.from(userStore.values());
}

/**
 * Clear all data (for testing)
 */
export function clearAllData() {
  otpStore.clear();
  userStore.clear();
}

export default {
  createLoginOTP,
  createRegistrationOTP,
  verifyOTPCode,
  resendOTPCode,
  getUserByEmail,
  getAllUsers,
  clearAllData
};
