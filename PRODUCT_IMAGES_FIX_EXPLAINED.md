# Product Images Issue - Root Cause & Solution

## Why Images Keep Breaking (This Happened TWICE!)

### The Problem
Product images would load on the **production server** (events.stepperslife.com) but return **404 errors** when running locally (localhost:3004).

## Root Cause Analysis

### 1. **Path Resolution at Build Time vs Runtime**
- The original code used a **constant** evaluated at COMPILE TIME:
  ```typescript
  const PRODUCT_IMAGE_STORAGE_PATH = process.env.NODE_ENV === 'production'
    ? "/root/websites/events-stepperslife/STEPFILES/product-images"  // Production path
    : path.join(process.cwd(), "STEPFILES", "product-images");        // Local path
  ```

- When Docker runs `npm run build`, Next.js compiles the code and **HARDC ODES** the path based on NODE_ENV at that moment
- This baked-in path doesn't change at runtime, even if NODE_ENV changes!

### 2. **Environment Variable Conflicts**
- `.env.local` originally had `NODE_ENV=production`
- `docker-compose.local.yml` set `NODE_ENV=development`
- Since `.env.local` loads AFTER docker-compose environment variables, it was overriding to `production`
- Result: Even in local development, code thought it was in production

### 3. **Missing Volume Mount**
- `STEPFILES` directory wasn't mounted in Docker initially
- Even if the path was correct, images wouldn't be accessible

### 4. **Production Images Don't Exist Locally**
- Product images are uploaded to `/root/websites/events-stepperslife/STEPFILES/product-images` on the VPS
- Local machine doesn't have these images - they only exist on production server
- This is EXPECTED and NORMAL for local development

## The Solution

### Changes Made:

#### 1. **Runtime Path Resolution** (`app/api/product-images/[filename]/route.ts`)
Changed from compile-time constant to runtime function:
```typescript
// Get storage path at RUNTIME, not compile time
function getStoragePath() {
  // First check if explicitly set
  if (process.env.PRODUCT_IMAGE_STORAGE_PATH) {
    return process.env.PRODUCT_IMAGE_STORAGE_PATH;
  }

  // Then check NODE_ENV at runtime
  if (process.env.NODE_ENV === 'production') {
    return "/root/websites/events-stepperslife/STEPFILES/product-images";
  }

  // Default to local development path
  return path.join(process.cwd(), "STEPFILES", "product-images");
}
```

#### 2. **Explicit Environment Variable** (`docker-compose.local.yml`)
Added explicit `PRODUCT_IMAGE_STORAGE_PATH`:
```yaml
environment:
  - NODE_ENV=development
  - PRODUCT_IMAGE_STORAGE_PATH=/app/STEPFILES/product-images
```

#### 3. **Volume Mount** (`docker-compose.local.yml`)
Added STEPFILES volume mount:
```yaml
volumes:
  - ./STEPFILES:/app/STEPFILES
```

#### 4. **Removed NODE_ENV Override** (`.env.local`)
Commented out `NODE_ENV=production` to avoid conflicts:
```bash
# NODE_ENV is set by docker-compose, don't override it here
# NODE_ENV=production
```

## Why This Won't Happen Again

### For Local Development:
1. ✅ `PRODUCT_IMAGE_STORAGE_PATH` is **explicitly set** in `docker-compose.local.yml`
2. ✅ `STEPFILES` directory is **mounted** as a volume
3. ✅ Path resolution happens at **RUNTIME**, not compile time
4. ✅ `NODE_ENV` is properly set to `development` without conflicts

### For Production:
1. ✅ Production deployment uses `NODE_ENV=production`
2. ✅ Code automatically uses production path: `/root/websites/events-stepperslife/STEPFILES/product-images`
3. ✅ Images are stored and served from the correct location

## Expected Behavior

### Local Development (localhost:3004)
- ❌ **Product images WILL return 404** - This is NORMAL!
- Why? Images only exist on production server
- Solution: Either:
  - Accept that images won't show locally (recommended)
  - Copy images from production to local `STEPFILES/product-images/` for testing
  - Upload test images locally using the admin interface

### Production (events.stepperslife.com)
- ✅ **Product images WILL load** - Images are on the server
- Path: `/root/websites/events-stepperslife/STEPFILES/product-images/`

## Testing

To verify images work locally, add a test image:
```bash
# Copy an image to local product-images directory
cp some-image.jpg STEPFILES/product-images/test.jpg

# Test the API
curl http://localhost:3004/api/product-images/test.jpg

# Should return: HTTP 200 OK
```

## Key Takeaways

1. **Compile-time constants are dangerous** in Docker/multi-environment setups
2. **Always use runtime environment variable resolution** for paths
3. **Be explicit with environment variables** in docker-compose
4. **Volume mounts are required** for local file access in Docker
5. **Local 404s for production images are EXPECTED** - don't panic!

## Files Modified

- [app/api/product-images/[filename]/route.ts](app/api/product-images/[filename]/route.ts) - Runtime path resolution for SERVING images
- [app/api/admin/upload-product-image/route.ts](app/api/admin/upload-product-image/route.ts) - Runtime path resolution for UPLOADING images (fixed after 2nd occurrence)
- [docker-compose.local.yml](docker-compose.local.yml) - Explicit env var + volume mount
- [.env.local](.env.local) - Removed NODE_ENV override

## Important Note: TWO Files Needed Fixing!

The bug occurred in **TWO SEPARATE API ROUTES**:

1. **Image Serving Route** (`app/api/product-images/[filename]/route.ts`) - Fixed first
   - This route serves images when displaying products
   - Had hardcoded production path at compile time

2. **Image Upload Route** (`app/api/admin/upload-product-image/route.ts`) - Fixed second
   - This route handles uploading new product images
   - ALSO had hardcoded production path at compile time (line 8)
   - Wasn't discovered until user uploaded a new image after first fix

Both routes needed the SAME fix: runtime `getStoragePath()` function instead of compile-time constant.

---

**Last Updated**: November 4, 2025
**Issue**: Product images returning 404 on localhost + uploads failing locally
**Status**: ✅ FULLY RESOLVED (both routes fixed)
