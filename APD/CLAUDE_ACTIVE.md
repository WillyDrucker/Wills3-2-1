# CLAUDE ACTIVE WORKING NOTES

## Purpose

This file serves as a temporary scratch pad for active session work. Use this file for:
- Working notes that don't yet belong in SESSION_HANDOFF or PROJECT_NOTES
- Temporary discoveries and observations
- Items that need to be organized later
- Session-specific debugging information

This file can be purged and cleaned as needed. It's an extension of SESSION_HANDOFF and PROJECT_NOTES to keep those files cleaner and more focused.

---

## Current Session Notes

### Claude-v5.6.3 - Issue 48: Authentication Redirect Fix (2025-01-30)

**Status**: Code fix complete - Supabase Dashboard configuration required

**Problem**: Sign-up confirmation emails redirect to localhost:3000 instead of production domains (wills321.com / beta.wills321.com)

**Root Cause**:
1. Supabase Dashboard Site URL configured for localhost:3000
2. signUp() code didn't include explicit emailRedirectTo option

**Code Fix Applied**:
- **File**: `src/services/authService.js` (lines 31-37)
- **Change**: Added `emailRedirectTo` option to signUp() call
- **Pattern**: Matches existing resetPasswordForEmail() implementation
- **Behavior**: Dynamic redirect using `window.location.origin`

**Before**:
```javascript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});
```

**After**:
```javascript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/index.html`
  }
});
```

**Why This Works**:
- Production sign-ups (wills321.com) → redirect to wills321.com/index.html
- Beta sign-ups (beta.wills321.com) → redirect to beta.wills321.com/index.html
- Local sign-ups (127.0.0.1:5500) → redirect to 127.0.0.1:5500/index.html
- Local sign-ups (localhost:8000) → redirect to localhost:8000/index.html

---

## REQUIRED: Manual Supabase Dashboard Configuration

**YOU MUST DO THIS** for the fix to work completely:

### Step 1: Update Site URL
**Location**: Supabase Dashboard > Authentication > URL Configuration

**Change**:
- **Current**: `http://localhost:3000`
- **New**: `https://wills321.com`

### Step 2: Add Redirect URLs to Whitelist
**Location**: Same page - "Redirect URLs" section

**Add these URLs** (one per line):
```
https://wills321.com/**
https://beta.wills321.com/**
http://127.0.0.1:5500/**
http://localhost:8000/**
```

**Note**: localhost:3000 is no longer needed and can be removed from whitelist

---

## Testing Checklist

After Supabase Dashboard configuration:

1. **Production Test** (wills321.com):
   - Sign up with new email
   - Check confirmation email redirect URL
   - Should be: `https://wills321.com/index.html?token=...`

2. **Beta Test** (beta.wills321.com):
   - Sign up with new email
   - Check confirmation email redirect URL
   - Should be: `https://beta.wills321.com/index.html?token=...`

3. **Local Test** (127.0.0.1:5500):
   - Sign up with new email
   - Check confirmation email redirect URL
   - Should be: `http://127.0.0.1:5500/index.html?token=...`

4. **Local Test** (localhost:8000):
   - Sign up with new email
   - Check confirmation email redirect URL
   - Should be: `http://localhost:8000/index.html?token=...`

---

## Files Modified

**Code Changes** (1 file):
- `src/services/authService.js` - Added emailRedirectTo option to signUp()

**Configuration Changes** (Manual):
- Supabase Dashboard > Authentication > URL Configuration
  - Site URL: localhost:3000 → wills321.com
  - Redirect URLs: Added wills321.com, beta.wills321.com, 127.0.0.1:5500, localhost:8000

---

## Technical Details

**Pattern Used**: Dynamic redirect matching password reset implementation
- Password reset (already working): `${window.location.origin}/reset-password.html`
- Sign-up (now fixed): `${window.location.origin}/index.html`

**Environment Support**:
- ✅ Production (wills321.com)
- ✅ Beta/Staging (beta.wills321.com)
- ✅ Local IDE Server (127.0.0.1:5500)
- ✅ Local Python Server (localhost:8000)
- ❌ localhost:3000 (deprecated - migrating to localhost:8000)

**Database**: Single Supabase database used for all environments (production, beta, local)
