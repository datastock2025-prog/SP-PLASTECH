const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = 'http://localhost:3000';
export const E2E_ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'admin';
export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'E2e#Secure2026pw';
const BOOTSTRAP_PASSWORD = process.env.E2E_BOOTSTRAP_PASSWORD ?? 'Plas!Tech#Boot91';

async function signIn(password: string): Promise<string | null> {
  const res = await fetch(`${API}/api/auth/sign-in/username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ username: E2E_ADMIN_USER, password }),
  });
  if (!res.ok) return null;
  return res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
}

// Provisions a usable admin (password rotated) and one plant so the app reaches the main shell.
export default async function globalSetup() {
  let cookie = await signIn(E2E_ADMIN_PASSWORD);
  if (!cookie) {
    cookie = await signIn(BOOTSTRAP_PASSWORD);
    if (!cookie) throw new Error('E2E setup: could not sign in with the admin or bootstrap password');
    const res = await fetch(`${API}/api/v1/me/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookie },
      body: JSON.stringify({ currentPassword: BOOTSTRAP_PASSWORD, newPassword: E2E_ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error(`E2E setup: password change failed (${res.status})`);
    cookie = await signIn(E2E_ADMIN_PASSWORD);
    if (!cookie) throw new Error('E2E setup: sign-in after password change failed');
  }

  const headers = { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookie };
  const plants = await (await fetch(`${API}/api/v1/plants`, { headers })).json();
  if (!plants.data?.length) {
    const res = await fetch(`${API}/api/v1/plants`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code: 'P1', name: 'E2E Plant', location: 'Test' }),
    });
    if (!res.ok) throw new Error(`E2E setup: plant creation failed (${res.status})`);
  }
}
