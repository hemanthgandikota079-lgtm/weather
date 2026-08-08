// Firebase has been removed from the project.
// This module provides lightweight stubs that preserve the original
// exported function signatures so UI code can continue to work.

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

function warn() {
  console.warn(
    'Firebase integration has been removed. Auth-related functions are now no-ops or return safe defaults. If you need authentication, re-add Firebase and implement these functions.'
  );
}

export async function registerUser(
  name: string,
  email: string,
  _password: string
): Promise<{ user: AuthUser }> {
  warn();
  // mark unused parameter as referenced to satisfy TypeScript's no-unused-parameter checks
  void _password;

  return {
    user: {
      id: 'stub-user',
      name: name || 'Weather User',
      email,
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
