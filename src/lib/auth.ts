// Firebase has been removed from the project.
// This module provides lightweight stubs that preserve the original
// exported function signatures so UI code can continue to work.
// Now includes OTP and Email Verification functionality

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

export interface OTPVerificationResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

function warn() {
  console.warn(
    'Firebase integration has been removed. Auth-related functions are now no-ops or return safe defaults. If you need authentication, re-add Firebase and implement these functions.'
  );
}

// ============ ORIGINAL AUTH FUNCTIONS ============

export async function registerUser(
  name: string,
  email: string,
  _password: string
): Promise<{ user: AuthUser }> {
  warn();
  void _password;

  return {
    user: {
      id: 'stub-user',
      name: name || 'Weather User',
      email,
      emailVerified: false,
    },
  };
}

export async function loginUser(
  email: string,
  _password: string
): Promise<{ user: AuthUser }> {
  warn();
  void _password;

  return {
    user: {
      id: 'stub-user',
      name: 'Weather User',
      email,
      emailVerified: true,
    },
  };
}

export async function loginWithGoogle(): Promise<{ user: AuthUser }> {
  warn();

  return {
    user: {
      id: 'stub-user',
      name: 'Weather User',
      email: '',
      emailVerified: true,
    },
  };
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  warn();

  throw new Error('Authentication is not available in this build.');
}

export async function saveHistory(_location: string): Promise<void> {
  warn();
  void _location;
}

export async function fetchHistory(
  _uid: string
): Promise<{ history: string[] }> {
  warn();
  void _uid;

  return {
    history: [],
  };
}

export async function logoutUser(): Promise<void> {
  warn();
}

export async function fetchUserProfile(
  _uid: string
): Promise<AuthUser | null> {
  warn();
  void _uid;

  return null;
}

// ============ NEW: EMAIL VERIFICATION & OTP FUNCTIONS ============

/**
 * Send OTP to user's email address
 * @param email - User's email address
 * @param type - 'login' | 'register' | 'verification'
 * @returns Promise with OTP request ID and status
 */
export async function sendOTP(email: string, type: 'login' | 'register' | 'verification' = 'login'): Promise<OTPResponse> {
  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, type }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    return {
      success: true,
      message: `OTP sent to ${email}`,
      requestId: data.requestId,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send OTP',
    };
  }
}

/**
 * Verify OTP code provided by user
 * @param email - User's email address
 * @param otp - 6-digit OTP code
 * @param requestId - Request ID from sendOTP response
 * @returns Promise with user data and auth token
 */
export async function verifyOTP(email: string, otp: string, requestId: string): Promise<OTPVerificationResponse> {
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, requestId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid OTP');
    }

    // Store auth token
    if (data.token) {
      localStorage.setItem('aurora-token', data.token);
    }

    return {
      success: true,
      message: 'Email verified successfully',
      user: data.user,
      token: data.token,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'OTP verification failed',
    };
  }
}

/**
 * Register user with email verification via OTP
 * @param name - User's full name
 * @param email - User's email address
 * @returns Promise with status
 */
export async function registerWithOTP(name: string, email: string): Promise<OTPResponse> {
  try {
    const response = await fetch('/api/auth/register-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return {
      success: true,
      message: `Registration code sent to ${email}`,
      requestId: data.requestId,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Login with email and OTP (passwordless)
 * @param email - User's email address
 * @returns Promise with status
 */
export async function loginWithOTP(email: string): Promise<OTPResponse> {
  try {
    const response = await fetch('/api/auth/login-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return {
      success: true,
      message: `OTP sent to ${email}`,
      requestId: data.requestId,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

/**
 * Resend OTP to email
 * @param email - User's email address
 * @param requestId - Original request ID
 * @returns Promise with status
 */
export async function resendOTP(email: string, requestId: string): Promise<OTPResponse> {
  try {
    const response = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, requestId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend OTP');
    }

    return {
      success: true,
      message: `OTP resent to ${email}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to resend OTP',
    };
  }
}

/**
 * Send verification email
 * @param email - User's email address
 * @returns Promise with status
 */
export async function sendVerificationEmail(email: string): Promise<OTPResponse> {
  try {
    const response = await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification email');
    }

    return {
      success: true,
      message: `Verification email sent to ${email}`,
      requestId: data.requestId,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send verification email',
    };
  }
}
