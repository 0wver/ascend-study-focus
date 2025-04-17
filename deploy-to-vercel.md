# Deploying Focus App to Vercel

This guide walks you through deploying your Focus App to Vercel, including handling the linting warnings.

## Prerequisites

1. Create a [Vercel](https://vercel.com) account if you don't already have one
2. Push your code to a GitHub repository

## Deployment Steps

### Option 1: Direct from GitHub (Recommended)

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`
5. Under "Build & Development Settings":
   - Set "Ignored Build Step" to `false` to allow the build to proceed despite linting warnings
6. Click "Deploy"

### Option 2: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   vercel --prod
   ```

4. Follow the interactive prompts

## Handling Linting Warnings

If you encounter linting errors during deployment, you have these options:

### Option A: Ignore Linting Errors During Build

Create a `.vercelignore` file with:
```
.eslintrc
.eslintrc.*
eslint.config.*
```

### Option B: Fix Linting Errors (Recommended)

The main linting errors are related to unused imports in `src/app/page.tsx`. You can:

1. Remove unused imports:
   ```jsx
   import { useState, useEffect, useMemo } from 'react';
   import { format, subDays } from 'date-fns';
   import { FiPlus, FiClock, FiBarChart2, FiCalendar, FiZap } from 'react-icons/fi';
   import { motion, AnimatePresence } from 'framer-motion';
   ```

2. Or disable the rule for this file by adding at the top:
   ```jsx
   /* eslint-disable @typescript-eslint/no-unused-vars */
   ```

## Post-Deployment

After successful deployment:

1. Vercel will provide you with a URL to access your app (e.g., `https://focus-app.vercel.app`)
2. Set up a custom domain if desired through Vercel dashboard
3. Configure environment variables if needed for future features

## Troubleshooting

If you encounter deployment issues:

1. Check Vercel deployment logs
2. Ensure your `next.config.js` is properly configured
3. Verify package versions are compatible
4. Consider simplifying the build by temporarily removing complex components

## Continuous Deployment

Vercel automatically sets up continuous deployment from your connected repository. Any push to the main branch will trigger a new deployment. 