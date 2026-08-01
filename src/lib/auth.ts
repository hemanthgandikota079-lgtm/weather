// Firebase has been removed from the project. This module provides lightweight stubs
// that preserve the original exported function signatures so UI code that imports
// auth functions continues to work without runtime errors. Each function logs a
// clear warning and returns safe defaults where appropriate.

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

export async function registerUser(name: string, email: string, password: string): Promise<{ user: AuthUser }> {
  warn();
  // Simulate a created user with a generated id. Do NOT use for real auth.
  return { user: { id: 'stub-user', name: name || 'Weather User', email } };
}

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser }> {
  warn();
  // Return a stub user. UI should treat this as unauthenticated for secure actions.
  return { user: { id: 'stub-user', name: 'Weather User', email } };
}

export async function loginWithGoogle(): Promise<{ user: AuthUser }> {
  warn();
  return { user: { id: 'stub-user', name: 'Weather User', email: '' } };
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  warn();
  throw new Error('Authentication is not available in this build.');
}

export async function saveHistory(location: string): Promise<void> {
  warn();
  // No-op
}

export async function fetchHistory(uid: string): Promise<{ history: string[] }> {
  warn();
  return { history: [] };
}

export async function logoutUser(): Promise<void> {
  warn();
  // No-op
}

export async function fetchUserProfile(uid: string): Promise<AuthUser | null> {
  warn();
  return null;
}
