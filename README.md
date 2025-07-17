# Survey Web App

A modern survey application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 Multiple authentication methods (Email, Phone, Google OAuth)
- 📊 Real-time admin dashboard with analytics
- 📱 Responsive design with smooth animations
- 🔒 Row Level Security (RLS) with Supabase
- 📈 Data visualization with charts

## Deployment Instructions

### Option 1: Vercel (Recommended)

1. **Fork this repository** to your GitHub account

2. **Set up Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and anon key from Settings > API

3. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "New Project" and import your forked repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Deploy!

4. **Configure Google OAuth (if needed):**
   - In Supabase Dashboard > Authentication > Providers
   - Enable Google provider
   - Add your Vercel domain to "Site URL" and "Redirect URLs"

### Option 2: Netlify

1. **Set up environment variables in Netlify:**
   - Go to Site settings > Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **Configure OAuth redirect URLs:**
   - Update Supabase Auth settings with your Netlify domain

### Option 3: Railway

1. **Deploy to Railway:**
   - Connect your GitHub repository
   - Add environment variables in Railway dashboard
   - Railway will automatically detect and build your Vite app

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your Supabase credentials
4. Run development server: `npm run dev`

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

The application will automatically create the necessary database tables when you first connect to Supabase. Make sure to:

1. Enable Row Level Security on your tables
2. Set up authentication providers in Supabase Dashboard
3. Configure OAuth redirect URLs for production domains

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Deployment:** Vercel/Netlify/Railway