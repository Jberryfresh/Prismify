# Email & Password Reset Setup Guide

Complete guide for configuring email verification and password reset functionality in Prismify using Supabase Auth.

## Overview

Prismify uses **Supabase Auth** for all authentication-related emails:

- Email verification for new signups
- Password reset emails
- Magic link (passwordless) authentication

## Quick Start

### 1. Configure Supabase Email Settings

Go to your Supabase dashboard: **Authentication → Email Templates**

#### Enable Email Confirmation

1. Navigate to: **Authentication → Settings → Email Auth**
2. Toggle **Enable email confirmations** (ON/OFF based on your preference)
   - **ON** = Users must verify email before signing in (recommended for production)
   - **OFF** = Users can sign in immediately (useful for development)

#### Configure SMTP (Optional - Recommended for Production)

By default, Supabase uses its built-in email service (limited to 3 emails/hour in free tier).

**For production, configure custom SMTP:**

1. Go to: **Project Settings → Auth → SMTP Settings**
2. Enable **Custom SMTP**
3. Fill in your SMTP provider details:
   ```
   Host: smtp.sendgrid.net (or your provider)
   Port: 587
   Username: apikey (for SendGrid)
   Password: your-api-key
   Sender Email: noreply@prismify.com
   Sender Name: Prismify
   ```

**Recommended SMTP providers:**

- **SendGrid** (12,000 free emails/month)
- **Postmark** (100 free emails/month, excellent deliverability)
- **AWS SES** (62,000 free emails/month with AWS Free Tier)
- **Mailgun** (5,000 free emails/month)

### 2. Customize Email Templates

#### Confirm Signup Email

**Path:** Authentication → Email Templates → Confirm signup

**Default variables available:**

- `{{ .ConfirmationURL }}` - Email verification link
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your app URL

**Example template:**

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

#### Reset Password Email

**Path:** Authentication → Email Templates → Reset password

**Variables:**

- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .Token }}` - Reset token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your app URL

**Example template:**

```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

#### Magic Link Email

**Path:** Authentication → Email Templates → Magic Link

**Example template:**

```html
<h2>Sign in to Prismify</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to your account</a></p>
<p>This link expires in 1 hour.</p>
```

### 3. Set Redirect URLs

Configure where users land after clicking email links:

**Go to:** Authentication → URL Configuration

Add allowed redirect URLs:

```
http://localhost:3000/auth/callback (development)
https://prismify.com/auth/callback (production)
```

### 4. Environment Variables

Ensure these are set in your `.env` file:

```bash
# App URL (where email links redirect to)
APP_URL=http://localhost:3000  # Development
# APP_URL=https://prismify.com  # Production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## API Usage

### Sign Up with Email Verification

```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "company": "Acme Corp"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe"
    },
    "session": null,
    "requiresConfirmation": true
  },
  "message": "Account created. Please check your email to verify your account."
}
```

### Resend Verification Email

```bash
POST /api/auth/verify/resend
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}
```

### Request Password Reset

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent."
}
```

### Update Password (Authenticated)

```bash
POST /api/auth/update-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "newPassword": "NewSecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password updated successfully."
}
```

### Send Magic Link

```bash
POST /api/auth/magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Magic link sent. Please check your email."
}
```

## Frontend Integration

### Email Verification Flow

**1. User signs up:**

```javascript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!',
  }),
});

const data = await response.json();

if (data.data.requiresConfirmation) {
  // Show message: "Check your email to verify your account"
}
```

**2. Create callback page** (`/auth/callback`):

```javascript
// Next.js example: app/auth/callback/page.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase automatically handles the email confirmation
    // Just redirect to dashboard after a moment
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  }, [router]);

  return (
    <div>
      <h1>Verifying your email...</h1>
      <p>Please wait while we confirm your account.</p>
    </div>
  );
}
```

### Password Reset Flow

**1. Password reset request page:**

```javascript
// app/auth/forgot-password/page.tsx
async function handleSubmit(email) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    alert('Password reset email sent! Check your inbox.');
  }
}
```

**2. Create reset password page** (`/auth/reset-password`):

```javascript
// app/auth/reset-password/page.tsx
async function handlePasswordReset(newPassword, accessToken) {
  const response = await fetch('/api/auth/update-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ newPassword }),
  });

  if (response.ok) {
    alert('Password updated! You can now sign in.');
    router.push('/auth/signin');
  }
}
```

## Testing

### Test Email Verification

```bash
# 1. Sign up a new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 2. Check your email inbox for verification link
# Click the link or manually visit:
# http://localhost:3000/auth/callback?token=...

# 3. Try to sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Test Password Reset

```bash
# 1. Request password reset
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Check email for reset link
# Click link to get access token

# 3. Update password
curl -X POST http://localhost:3000/api/auth/update-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_from_email>" \
  -d '{"newPassword":"NewPassword123!"}'
```

## Email Template Customization

### Branded Email Template Example

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .logo {
        text-align: center;
        margin-bottom: 30px;
      }
      .button {
        display: inline-block;
        padding: 12px 30px;
        background-color: #6366f1;
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        color: #666;
        font-size: 12px;
        margin-top: 30px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <h1 style="color: #6366f1;">Prismify</h1>
        <p style="color: #666;">AI-Powered SEO Optimization</p>
      </div>

      <h2>Welcome to Prismify!</h2>
      <p>Thanks for signing up. Please confirm your email address to get started.</p>

      <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this URL into your browser:<br />
        <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
      </p>

      <div class="footer">
        <p>This email was sent to {{ .Email }}</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>&copy; 2025 Prismify. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
```

## Troubleshooting

### Issue: Emails not being received

**Solutions:**

1. Check spam/junk folder
2. Verify SMTP configuration in Supabase dashboard
3. Check Supabase logs: **Authentication → Logs**
4. Ensure email isn't rate-limited (3 emails/hour on free tier)
5. Add sender email to contacts/safe senders

### Issue: "Email not confirmed" error on sign in

**Solutions:**

1. Check if email confirmation is enabled in Supabase
2. Resend verification email via `/api/auth/verify/resend`
3. Manually confirm email in Supabase dashboard (for testing)
4. Disable email confirmation temporarily for development

### Issue: Password reset link expired

**Solutions:**

- Links expire after 1 hour (Supabase default)
- Request a new password reset link
- Consider adjusting expiry time in Supabase settings

### Issue: Redirect URL not working

**Solutions:**

- Ensure redirect URL is added to Supabase allowed list
- Check `APP_URL` environment variable is correct
- Verify redirect URL includes `/auth/callback` path

## Security Best Practices

1. **Rate Limiting:** Limit password reset requests (5 per hour per IP)
2. **Strong Passwords:** Enforce minimum 8 characters (add complexity requirements)
3. **HTTPS Only:** Always use HTTPS in production
4. **Email Validation:** Block disposable email addresses
5. **Token Expiry:** Keep short expiry times for reset links (1 hour default)
6. **Audit Logs:** Monitor authentication events in Supabase
7. **Two-Factor Auth:** Consider adding 2FA for Agency tier users (Phase 7+)

## Next Steps

- [ ] Customize email templates in Supabase dashboard
- [ ] Configure custom SMTP for production
- [ ] Create frontend callback pages (`/auth/callback`, `/auth/reset-password`)
- [ ] Test full signup → verify → signin flow
- [ ] Test password reset flow
- [ ] Implement rate limiting for password reset requests
- [ ] Add email to welcome sequence (Customer Success Agent - Phase 7)

## Related Documentation

- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Best Practices](https://www.ietf.org/rfc/rfc5321.txt)
