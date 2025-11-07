# Authentication Module

Complete authentication system for Prismify using Supabase Auth.

## Features

- ✅ Email/password authentication
- ✅ OAuth providers (Google, GitHub)
- ✅ JWT token management
- ✅ Session handling
- ✅ Password reset
- ✅ Email verification
- ✅ User metadata management
- ✅ Admin operations (with service role)
- ✅ Authentication middleware
- ✅ Rate limiting

## Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, for admin ops

# App Configuration
APP_URL=http://localhost:3000
```

### 2. Basic Usage

```javascript
import { authService, requireAuth } from './services/auth/index.js';

// Sign up a new user
const { user, session, error } = await authService.signUp(
  'user@example.com',
  'SecurePassword123!',
  {
    full_name: 'John Doe',
    company: 'Acme Corp',
  }
);

// Sign in
const { user, session, error } = await authService.signIn('user@example.com', 'SecurePassword123!');

// Get current user
const { user } = await authService.getUser();

// Sign out
await authService.signOut();
```

### 3. Protect API Routes

```javascript
import express from 'express';
import { requireAuth, optionalAuth } from './middleware/auth.js';

const app = express();

// Protected route - requires authentication
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Optional auth - user may or may not be logged in
app.get('/api/public', optionalAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user || null,
    message: req.user ? 'Authenticated' : 'Anonymous',
  });
});
```

## API Reference

### AuthService Methods

#### `signUp(email, password, metadata)`

Create a new user account.

**Parameters:**

- `email` (string) - User's email address
- `password` (string) - User's password (min 8 characters)
- `metadata` (object) - Additional user data (name, company, etc.)

**Returns:** `Promise<{user, session, error, requiresConfirmation}>`

**Example:**

```javascript
const result = await authService.signUp('user@example.com', 'Password123!', {
  full_name: 'Jane Doe',
});
```

#### `signIn(email, password)`

Sign in an existing user.

**Parameters:**

- `email` (string) - User's email address
- `password` (string) - User's password

**Returns:** `Promise<{user, session, error}>`

#### `signInWithOAuth(provider, redirectTo)`

Initiate OAuth sign in.

**Parameters:**

- `provider` (string) - OAuth provider ('google', 'github', etc.)
- `redirectTo` (string) - URL to redirect after authentication

**Returns:** `Promise<{url, error}>`

**Example:**

```javascript
const { url } = await authService.signInWithOAuth('google');
// Redirect user to url
```

#### `signOut()`

Sign out the current user.

**Returns:** `Promise<{success, error}>`

#### `getSession()`

Get the current session.

**Returns:** `Promise<{session, error}>`

#### `getUser()`

Get the current authenticated user.

**Returns:** `Promise<{user, error}>`

#### `refreshSession()`

Refresh the current session.

**Returns:** `Promise<{session, error}>`

#### `resetPassword(email)`

Send password reset email.

**Parameters:**

- `email` (string) - User's email address

**Returns:** `Promise<{success, error}>`

#### `updatePassword(newPassword)`

Update user's password.

**Parameters:**

- `newPassword` (string) - New password

**Returns:** `Promise<{success, error}>`

#### `updateUserMetadata(metadata)`

Update user metadata.

**Parameters:**

- `metadata` (object) - Metadata to update

**Returns:** `Promise<{user, error}>`

#### `verifyToken(token)`

Verify JWT token and return user.

**Parameters:**

- `token` (string) - JWT token to verify

**Returns:** `Promise<{user, error}>`

#### `onAuthStateChange(callback)`

Listen to authentication state changes.

**Parameters:**

- `callback` (function) - Callback function `(event, session) => {}`

**Returns:** Subscription object with `unsubscribe()` method

**Example:**

```javascript
const subscription = authService.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
  }
});

// Later: unsubscribe
subscription.unsubscribe();
```

### Admin Methods (Requires Service Role Key)

#### `adminGetUser(userId)`

Get user by ID (admin operation).

**Parameters:**

- `userId` (string) - User ID

**Returns:** `Promise<{user, error}>`

#### `adminDeleteUser(userId)`

Delete user by ID (admin operation).

**Parameters:**

- `userId` (string) - User ID to delete

**Returns:** `Promise<{success, error}>`

## Middleware Reference

### `requireAuth`

Requires valid JWT token. Blocks unauthenticated requests.

**Request Extensions:**

- `req.user` - User object
- `req.userId` - User ID

**Response on Failure:** `401 Unauthorized`

**Example:**

```javascript
app.get('/api/protected', requireAuth, (req, res) => {
  console.log('User ID:', req.userId);
  res.json({ user: req.user });
});
```

### `optionalAuth`

Allows requests with or without authentication.

**Request Extensions:**

- `req.user` - User object or null
- `req.userId` - User ID or null

**Example:**

```javascript
app.get('/api/public', optionalAuth, (req, res) => {
  const message = req.user ? `Hello ${req.user.email}` : 'Hello guest';
  res.json({ message });
});
```

### `requireAdmin`

Requires user to have admin role. Use after `requireAuth`.

**Admin Detection:**

- `user.user_metadata.role === 'admin'`
- `user.app_metadata.role === 'admin'`

**Response on Failure:** `403 Forbidden`

**Example:**

```javascript
app.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  // Only admins can access this
  res.json({ message: 'User deleted' });
});
```

### `requireOwnership`

Verifies user owns the resource being accessed.

Looks for user ID in: `params.userId`, `body.userId`, `query.userId`

**Response on Failure:** `403 Forbidden`

**Example:**

```javascript
app.get('/api/users/:userId/profile', requireAuth, requireOwnership, (req, res) => {
  // User can only access their own profile
  res.json({ profile: req.user });
});
```

### `rateLimitByUser(maxRequests, windowMs)`

Rate limits requests per authenticated user.

**Parameters:**

- `maxRequests` (number) - Max requests per window (default: 100)
- `windowMs` (number) - Time window in ms (default: 60000 = 1 minute)

**Response on Failure:** `429 Too Many Requests`

**Example:**

```javascript
app.post('/api/audits', requireAuth, rateLimitByUser(10, 60000), (req, res) => {
  // Max 10 audits per minute per user
  res.json({ message: 'Audit started' });
});
```

## Testing

Run the auth test suite:

```bash
npm run test:auth
```

This will:

1. Create a test user
2. Test sign in
3. Test session management
4. Test token verification
5. Test password reset
6. Sign out

**Note:** Tests create a real user in your Supabase instance. Delete test users manually if needed.

## Security Best Practices

### 1. Never Expose Service Role Key

```javascript
// ❌ BAD - Don't use service key on client side
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ GOOD - Use anon key on client, service key only on server
const supabase = createClient(url, ANON_KEY);
```

### 2. Always Use HTTPS in Production

Set `APP_URL` to HTTPS URL:

```bash
APP_URL=https://prismify.com
```

### 3. Validate Password Strength

```javascript
// Minimum requirements:
// - 8 characters
// - 1 uppercase
// - 1 lowercase
// - 1 number
// - 1 special character

function validatePassword(password) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}
```

### 4. Implement Rate Limiting

```javascript
import { rateLimitByUser } from './middleware/auth.js';

// Limit sensitive operations
app.post(
  '/api/auth/reset-password',
  rateLimitByUser(5, 3600000), // 5 requests per hour
  async (req, res) => {
    // Password reset logic
  }
);
```

### 5. Use Row Level Security (RLS)

Enable RLS in Supabase for all tables:

```sql
-- Example: Users can only see their own audits
CREATE POLICY "Users can view own audits"
ON audits FOR SELECT
USING (auth.uid() = user_id);
```

## Error Handling

All auth methods return consistent error format:

```javascript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable error message'
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - No auth token provided
- `INVALID_TOKEN` - Token is invalid or expired
- `FORBIDDEN` - User lacks required permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `MISSING_USER_ID` - Required user ID not found
- `AUTH_ERROR` - General authentication error

### Handle Errors Gracefully

```javascript
const { user, error } = await authService.signIn(email, password);

if (error) {
  if (error.message.includes('Invalid login credentials')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Incorrect email or password' },
    });
  }

  if (error.message.includes('Email not confirmed')) {
    return res.status(403).json({
      success: false,
      error: { message: 'Please confirm your email first' },
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    error: { message: 'Authentication failed' },
  });
}
```

## Troubleshooting

### Issue: "Missing required Supabase environment variables"

**Solution:** Ensure `.env` file contains:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Issue: "Email not confirmed" error on sign in

**Solution:**

1. Check Supabase email settings (Auth > Email Templates)
2. Disable email confirmation in Supabase (Auth > Settings > Email Auth) for development
3. Confirm email manually in Supabase dashboard

### Issue: Token verification fails

**Causes:**

- Token expired (default: 1 hour)
- Token was generated with different Supabase project
- Token format incorrect (should be `Bearer <token>`)

**Solution:**

```javascript
// Refresh expired token
const { session } = await authService.refreshSession();
const newToken = session.access_token;
```

### Issue: Admin operations fail

**Solution:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Next Steps

1. **Implement Password Reset Flow** (Task 2.1.2)
   - Email verification
   - Password reset emails

2. **Add Role-Based Access Control** (Task 2.1.3)
   - Subscription tier enforcement
   - Admin role checks

3. **Integrate with API Routes** (Phase 2.3)
   - User profile endpoints
   - Audit endpoints with auth

4. **Add OAuth Configuration** (Supabase Dashboard)
   - Google OAuth
   - GitHub OAuth

## Related Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
