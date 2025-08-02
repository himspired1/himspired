# Environment Variables

This document describes the environment variables required for the Himspired application.

## URL Configuration

The application uses several environment variables to determine the base URL for sitemaps, metadata, and other features. The following variables are checked in order of priority:

### Primary URL Variables

1. **`NEXT_PUBLIC_URL`** - Primary URL for client-side usage

   ```bash
   NEXT_PUBLIC_URL=https://yourdomain.com
   ```

2. **`BASE_URL`** - Alternative base URL

   ```bash
   BASE_URL=https://yourdomain.com
   ```

3. **`NEXT_PUBLIC_BASE_URL`** - Another alternative

   ```bash
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

4. **`SITE_URL`** - General site URL

   ```bash
   SITE_URL=https://yourdomain.com
   ```

5. **`VERCEL_URL`** - Automatically provided by Vercel deployments
   ```bash
   # Automatically set by Vercel
   VERCEL_URL=your-app.vercel.app
   ```

### URL Format

URLs can be provided with or without the protocol:

- ✅ `https://yourdomain.com`
- ✅ `http://localhost:3000`
- ✅ `yourdomain.com` (will be prefixed with `https://`)

### Environment-Specific Behavior

#### Development

- **Fallback**: `http://localhost:3000`
- **No environment variable required** for local development

#### Production

- **Required**: At least one of the URL environment variables must be set
- **Error**: If no URL is provided, the application will throw an error

### Example Configuration

#### Local Development (.env.local)

```bash
# Optional for local development
NEXT_PUBLIC_URL=http://localhost:3000
```

#### Production (.env.production)

```bash
# Required for production
NEXT_PUBLIC_URL=https://himspired.vercel.app
# or
SITE_URL=https://himspired.vercel.app
```

#### Vercel Deployment

```bash
# Automatically handled by Vercel
# VERCEL_URL is automatically set
```

### Usage in Code

The URL is accessed through the `getSiteUrl()` function:

```typescript
import { getSiteUrl } from "@/lib/env";

const baseUrl = getSiteUrl();
// Returns the configured URL or throws an error in production
```

### Error Handling

If no URL is configured in production, the application will throw an error:

```
Error: SITE_URL environment variable is required in production.
Please set NEXT_PUBLIC_URL, BASE_URL, NEXT_PUBLIC_BASE_URL, SITE_URL, or VERCEL_URL.
```

This ensures that the application fails fast if not properly configured, rather than using incorrect URLs.

## Other Environment Variables

### Database

```bash
MONGODB_URI=mongodb://localhost:27017/himspired
```

### JWT Authentication

```bash
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
```

### Admin Authentication

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
ADMIN_PASSWORD_HASH=hashed-password
```

### Email Configuration

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Cloudinary (File Uploads)

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Deployment Checklist

Before deploying to production, ensure:

1. ✅ All required environment variables are set
2. ✅ URL environment variable is configured
3. ✅ Database connection is working
4. ✅ Email service is configured
5. ✅ File upload service is configured
6. ✅ Admin credentials are secure

## Troubleshooting

### Common Issues

1. **"SITE_URL environment variable is required"**

   - Solution: Set one of the URL environment variables

2. **Invalid URL format**

   - Solution: Ensure URL includes protocol (http:// or https://)

3. **Development vs Production confusion**
   - Solution: Use different .env files for different environments
