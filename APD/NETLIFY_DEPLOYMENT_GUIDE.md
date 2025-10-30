# NETLIFY AUTOMATED DEPLOYMENT GUIDE

## Overview

This guide explains how to set up automated deployment from GitHub to Netlify, so that pushing code to your repository automatically updates wills321.com (and optionally beta.wills321.com).

**Current Method**: Manual drag-and-drop to Netlify
**New Method**: Automatic deployment on `git push`

---

## Prerequisites

- ✅ GitHub repository: WillyDrucker/Wills3-2-1
- ✅ Netlify account (existing - already have manual deployments)
- ✅ Custom domains: wills321.com and beta.wills321.com

---

## Part 1: Connect GitHub Repository to Netlify

### Step 1: Import from Git

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Click**: "Add new site" dropdown → "Import an existing project"
3. **Choose**: "Deploy with GitHub"
4. **Authorize**: Allow Netlify to access your GitHub account (if not already authorized)
5. **Select Repository**: Find and select `WillyDrucker/Wills3-2-1`

### Step 2: Configure Build Settings

On the "Site settings for WillyDrucker/Wills3-2-1" page:

**Basic build settings**:
- **Branch to deploy**: `main`
- **Build command**: (leave empty - no build process needed)
- **Publish directory**: `/` or `.` (deploy from root directory)
- **Functions directory**: (leave empty - not using serverless functions)

**Advanced build settings** (optional):
- Skip environment variables (Supabase keys are public anon keys, safe to commit)

### Step 3: Deploy Site

1. **Click**: "Deploy WillyDrucker/Wills3-2-1" button
2. **Wait**: Initial deployment completes (~30 seconds)
3. **Note**: You'll get a random Netlify URL like `dreamy-goldberg-abc123.netlify.app`

---

## Part 2: Configure Production Domain (wills321.com)

### Step 1: Add Custom Domain

1. **Go to**: Site settings → Domain management → Domains
2. **Click**: "Add a domain"
3. **Enter**: `wills321.com`
4. **Click**: "Verify" → "Add domain"

### Step 2: Configure DNS

**If you manage DNS at your domain registrar** (e.g., GoDaddy, Namecheap):

**A Record** (for root domain):
```
Type: A
Name: @ (or leave blank for root)
Value: 75.2.60.5 (Netlify's IP - check current IP in Netlify dashboard)
TTL: Automatic or 3600
```

**CNAME Record** (for www subdomain):
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app (from Step 3 above)
TTL: Automatic or 3600
```

**If you want Netlify to manage DNS**:
1. Netlify will provide nameservers
2. Update nameservers at your domain registrar
3. DNS managed entirely by Netlify (easier)

### Step 3: Enable HTTPS

1. **Wait**: DNS propagation (5 minutes to 24 hours, usually ~1 hour)
2. **Netlify Auto-Configuration**: Once DNS propagates, Netlify automatically provisions SSL certificate (Let's Encrypt)
3. **Verify**: Visit https://wills321.com → Should show secure padlock

### Step 4: Set as Primary Domain

1. **Go to**: Domain management
2. **Find**: `wills321.com` in domain list
3. **Click**: Options (3 dots) → "Set as primary domain"
4. **Result**: All traffic redirects to wills321.com (including netlify.app URL)

---

## Part 3: Configure Beta Branch Deployment (Optional)

**Use Case**: Test changes on beta.wills321.com before deploying to production

### Step 1: Create Beta Branch in GitHub

```bash
# Create and push beta branch
git checkout -b beta
git push -u origin beta
```

### Step 2: Enable Branch Deploys in Netlify

1. **Go to**: Site settings → Build & deploy → Continuous deployment
2. **Scroll to**: "Branch deploys"
3. **Change**: "Deploy only the production branch" → "Let me add individual branches"
4. **Click**: "Add branch"
5. **Enter**: `beta`
6. **Save**

### Step 3: Configure Beta Subdomain

1. **Go to**: Domain management → Domains
2. **Click**: "Add domain alias"
3. **Enter**: `beta.wills321.com`
4. **Configure DNS** (at your domain registrar):
   ```
   Type: CNAME
   Name: beta
   Value: your-site-name.netlify.app
   TTL: Automatic or 3600
   ```

### Step 4: Link Beta Branch to Beta Domain

**Option A: Automatic (Netlify Deploy URL)**:
- Beta branch deploys to: `beta--your-site-name.netlify.app`
- Configure CNAME to point to this URL

**Option B: Manual Domain Assignment**:
1. **Go to**: Site settings → Build & deploy → Deploy contexts
2. **Find**: Beta branch deployment
3. **Assign**: beta.wills321.com subdomain to beta branch

**Result**:
- Push to `main` → deploys to wills321.com
- Push to `beta` → deploys to beta.wills321.com

---

## Part 4: Deployment Workflow

### Daily Workflow (After Setup)

**For Production Deployment**:
```bash
# Make changes locally
# ... edit files ...

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub main branch
git push origin main

# Netlify automatically detects push and deploys
# Site live in ~30 seconds at wills321.com
```

**For Beta Testing** (if using beta branch):
```bash
# Work on beta branch
git checkout beta

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Test changes"
git push origin beta

# Deploys to beta.wills321.com automatically
# After testing, merge to main:
git checkout main
git merge beta
git push origin main
# Now deployed to wills321.com
```

### Monitoring Deployments

1. **Netlify Dashboard**: Real-time deployment status
2. **GitHub Integration**: Deployment status appears on commits
3. **Deploy Notifications**: Optional Slack/email alerts

---

## Part 5: Advanced Features (Optional)

### Deploy Previews for Pull Requests

**Enable**:
1. Settings → Build & deploy → Deploy contexts
2. Enable "Deploy previews"
3. Set to "Any pull request against your production branch"

**How it works**:
1. Create pull request on GitHub
2. Netlify automatically creates preview deployment
3. Preview URL appears in PR comments
4. Test changes before merging
5. Merge PR → auto-deploys to production

### Environment Variables (If Needed in Future)

**Current Status**: Not needed (Supabase keys are public anon keys)

**If you add sensitive keys later**:
1. Settings → Environment variables
2. Add key/value pairs
3. Available during build and at runtime

### Rollback to Previous Deployment

**If deployment breaks something**:
1. Go to: Deploys tab
2. Find: Previous working deployment
3. Click: Options (3 dots) → "Publish deploy"
4. Site instantly reverted to previous version

---

## Part 6: Troubleshooting

### Issue: DNS Not Propagating

**Solution**:
- Wait up to 24 hours
- Check DNS with: https://dnschecker.org
- Clear browser cache
- Try incognito mode

### Issue: HTTPS Certificate Fails

**Solution**:
- Verify DNS is propagated
- Netlify → Domain settings → "Verify DNS configuration"
- Try: "Renew certificate" button

### Issue: Site Shows 404 on Refresh

**Solution**:
- ✅ Already fixed with `_redirects` file
- File must be in root directory
- Content: `/*    /index.html   200`

### Issue: Deploy Fails

**Check**:
1. Netlify deploy logs (in dashboard)
2. Build settings (should be empty for vanilla JS)
3. Publish directory (should be `/` or `.`)

### Issue: Old Site Still Showing

**Solutions**:
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check Netlify shows "Published" status
- Verify correct branch deployed
- Check DNS points to Netlify

---

## Part 7: Migration from Manual Deployment

### Before First Automated Deploy

**Current Setup**:
- Manually dragging files to Netlify
- Existing site at wills321.com and beta.wills321.com

**Migration Steps**:

1. **Verify Local Code Matches Deployed Code**:
   - Your local repository should have latest changes
   - Any manual changes on Netlify will be overwritten

2. **Commit Everything to GitHub**:
   ```bash
   git add .
   git commit -m "Pre-automation snapshot"
   git push origin main
   ```

3. **Set Up Automated Deployment** (follow Parts 1-2 above)

4. **First Automated Deploy**:
   - Netlify will deploy from GitHub
   - Should match your manual deployment
   - Verify site works correctly

5. **Delete Manual Site** (if it's separate):
   - If you have two Netlify sites (manual + automated), delete the manual one
   - Transfer domain from manual site to automated site

### After Setup

**Stop**: Manual drag-and-drop deployments
**Start**: Push to GitHub → automatic deployment

---

## Quick Reference

### Essential Git Commands

```bash
# Check current branch
git branch

# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Stage all changes
git add .

# Commit with message
git commit -m "Your message here"

# Push to GitHub (triggers deployment)
git push origin main

# View commit history
git log --oneline
```

### Netlify CLI (Optional - Advanced)

Install Netlify CLI for local testing:
```bash
npm install -g netlify-cli

# Link local project to Netlify site
netlify link

# Test site locally
netlify dev

# Deploy manually via CLI
netlify deploy --prod
```

---

## Summary

**One-Time Setup**: 15-20 minutes
**Daily Workflow**: `git push` → automatic deployment (30 seconds)
**Benefits**:
- ✅ No manual uploads
- ✅ Version control integration
- ✅ Automatic HTTPS
- ✅ Deploy previews for testing
- ✅ Easy rollbacks
- ✅ Deployment history

**Next Steps**:
1. Follow Part 1 to connect GitHub to Netlify
2. Follow Part 2 to configure wills321.com
3. (Optional) Follow Part 3 for beta.wills321.com
4. Start using `git push` for deployments!
