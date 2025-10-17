# OAuth Error Handling

## OAuth Login Failed Page

**Route**: `/oauth/callback/login-failed`

### Purpose
Dedicated error page for OAuth-specific authentication failures. This page is shown when Google OAuth login fails for various reasons.

### Features
- 🎨 Branded error design matching Piatto style
- 🔄 "Retry with Google" button to attempt OAuth again
- ↩️ "Back to Login" for alternative sign-in methods
- 🏠 "Go Home" to return to landing page
- 📋 Helpful troubleshooting tips for OAuth issues
- 🔗 Link to email/password login as alternative

### Error Flow
```
User clicks "Sign in with Google"
    ↓
Backend: /api/auth/login/google
    ↓
Google OAuth Flow
    ↓
Backend: /api/auth/google/callback
    ↓
Error occurs?
    ↓
Redirect to: /oauth/callback/login-failed?reason=<error_message>
```

### Common Error Reasons
1. **OAuth Provider Errors**: Issues from Google's OAuth service
2. **Session Verification Failed**: Cookie not set or invalid
3. **Unexpected Errors**: Backend processing errors

### URL Parameters
- `reason` (string): Detailed error message from backend

### Example URLs
```
/oauth/callback/login-failed?reason=Unexpected+error+occurred+during+OAuth+login
/oauth/callback/login-failed?reason=session_verification_failed
/oauth/callback/login-failed?reason=User+cancelled+the+OAuth+flow
```

### User Actions Available
1. **Retry with Google**: Attempts OAuth login again
2. **Back to Login**: Returns to `/login` page
3. **Go Home**: Returns to landing page `/`
4. **Sign in with Email**: Links to email/password login
5. **Contact Support**: Links to `/contact` page

### Troubleshooting Tips Shown
- Enable pop-ups in browser
- Use valid Google account
- Clear browser cache/cookies
- Check third-party cookies settings

### Component Location
`src/pages/auth/OAuthLoginFailedPage.jsx`

### Related Files
- `src/pages/auth/OAuthCallbackPage.jsx` - Redirects here on error
- `src/pages/auth/LoginFailedPage.jsx` - General login errors (email/password)
- `src/App.jsx` - Route definition

### Differences from LoginFailedPage
- **OAuthLoginFailedPage**: OAuth-specific errors with "Retry with Google" button
- **LoginFailedPage**: Email/password login errors with "Try Again" to login form

### Design Elements
- Red error badge with AlertCircle icon
- Error reason displayed in red box
- Multiple action buttons with different styles
- Helpful troubleshooting section
- Alternative login method suggestion
