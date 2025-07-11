# Deployment Instructions

## Quick Deploy Options

### 🚀 Vercel (Recommended - 5 minutes)

1. **Prepare Supabase:**
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Copy URL and anon key from Settings > API

2. **Deploy to Vercel:**
   - Fork this repo to your GitHub
   - Go to [vercel.com](https://vercel.com)
   - Import your forked repository
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your_anon_key_here
     ```
   - Deploy!

3. **Configure OAuth:**
   - In Supabase: Authentication > Providers > Google
   - Add your Vercel URL to redirect URLs
   - Example: `https://your-app.vercel.app/auth`

### 🌐 Railway

1. **One-click deploy:**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub and select your repo
   - Add environment variables in dashboard
   - Railway auto-detects Vite and builds

### 📦 Netlify

1. **Deploy:**
   - Connect repo to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables in Site settings

## Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Post-Deployment Checklist

- [ ] Test authentication (email, phone, Google)
- [ ] Verify survey form submission
- [ ] Check admin dashboard access
- [ ] Test data export functionality
- [ ] Confirm responsive design on mobile

## Troubleshooting

**OAuth not working?**
- Check redirect URLs in Supabase match your domain
- Ensure environment variables are set correctly

**Database errors?**
- Verify Supabase connection
- Check if RLS policies are enabled
- Ensure tables exist (they're created automatically)

**Build failures?**
- Check all environment variables are set
- Verify Node.js version compatibility (16+)