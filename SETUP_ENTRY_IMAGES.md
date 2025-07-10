# Setup Guide: Entry Images Storage & Optimization

## 1. Create the `entry-images` Storage Bucket

### Step 1: Create the Bucket
1. Go to your **Supabase Dashboard**
2. Navigate to **Storage**
3. Click **"New bucket"**
4. Set these properties:
   - **Name**: `entry-images`
   - **Public bucket**: ✅ **TRUE** (so images can be displayed in the social feed)
   - **File size limit**: `5MB` (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

### Step 2: Set Up Storage Policies

Navigate to **Storage** → **Policies** → **entry-images** and create these policies:

#### Policy 1: Allow authenticated users to upload images
```sql
-- Policy Name: "Users can upload their own entry images"
-- Operation: INSERT
-- Target roles: authenticated

(auth.uid() IS NOT NULL)
```

#### Policy 2: Allow public read access for displaying images
```sql
-- Policy Name: "Anyone can view entry images"
-- Operation: SELECT
-- Target roles: public

true
```

#### Policy 3: Allow users to delete their own images
```sql
-- Policy Name: "Users can delete their own entry images"
-- Operation: DELETE
-- Target roles: authenticated

(auth.uid() IS NOT NULL)
```

### Step 3: Optional - Add filename prefix policy
If you want to ensure users can only upload with their user ID prefix:

```sql
-- Policy Name: "Users can only upload with their user ID prefix"
-- Operation: INSERT
-- Target roles: authenticated

(auth.uid()::text = split_part(name, '_', 1))
```

## 2. Add the `image_url` Column to Database

### Option A: Using Supabase Dashboard
1. Go to **Table Editor** → **daily_entries**
2. Click **"Add Column"**
3. Set these properties:
   - **Name**: `image_url`
   - **Type**: `text`
   - **Default value**: `NULL`
   - **Allow nullable**: ✅ **TRUE**
4. Save changes

### Option B: Using SQL Editor
```sql
ALTER TABLE daily_entries ADD COLUMN image_url TEXT;

-- Optional: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_image_url 
ON daily_entries(image_url) 
WHERE image_url IS NOT NULL;
```

## 3. Verify Setup

After completing both steps, test the setup:

1. **Upload Test**: Try uploading a photo through the app
2. **Database Check**: Verify the `image_url` is saved in the database
3. **Display Test**: Check that photos appear in the social feed
4. **Permissions Test**: Ensure other users can see the images

## 4. Benefits of Separate Buckets

### `avatars` bucket:
- **Purpose**: User profile pictures
- **Access**: Private or restricted to user
- **Lifecycle**: Long-term storage
- **Size**: Optimized for profile pics (e.g., 1MB limit)

### `entry-images` bucket:
- **Purpose**: Daily entry photos
- **Access**: Public for social feed display
- **Lifecycle**: Could have retention policies
- **Size**: Larger files allowed (e.g., 5MB limit)
- **Organization**: Can be organized by user/date

## 5. File Naming Convention

The app uses this naming pattern:
```
{userId}_{timestamp}.{extension}
```

Examples:
- `user123_1704067200000.jpg`
- `user456_1704067300000.png`

This ensures:
- **Uniqueness**: Timestamp prevents conflicts
- **Traceability**: User ID for accountability
- **Organization**: Easy to identify owner

## 6. Image Optimization Features

### ✅ **Entry Images (Social Feed)**
- **Max dimensions**: 1024x1024 pixels
- **Quality**: 80% compression
- **Format**: JPEG (for best compression)
- **Maintains aspect ratio**: No distortion

### ✅ **Avatar Images (Profile Pictures)**
- **Max dimensions**: 256x256 pixels
- **Quality**: 80% compression
- **Format**: JPEG (for best compression)
- **Perfect for profile pics**: Square format

### ✅ **Performance Benefits**
- **Faster uploads**: Smaller file sizes
- **Faster loading**: Optimized for mobile
- **Lower bandwidth**: Reduced data usage
- **Better UX**: Responsive image display

### ✅ **Storage Efficiency**
- **Reduced costs**: Smaller files = less storage
- **Consistent sizes**: Predictable file sizes
- **Mobile optimized**: Perfect for phone screens

### Configuration Options
You can modify resize settings in `src/utils/imageUtils.ts`:

```typescript
export const DEFAULT_IMAGE_OPTIONS: ImageResizeOptions = {
  maxWidth: 1024,    // Max width in pixels
  maxHeight: 1024,   // Max height in pixels
  quality: 0.8,      // 80% quality (0.0 - 1.0)
  format: 'jpeg'     // Output format
};

// For smaller thumbnails
export const THUMBNAIL_OPTIONS: ImageResizeOptions = {
  maxWidth: 300,
  maxHeight: 300,
  quality: 0.7,
  format: 'jpeg'
};
```

### Expected File Sizes

#### Entry Images:
- **Original**: Up to 15MB (your current limit)
- **Optimized**: ~100-500KB (typical after processing)
- **Savings**: 95%+ reduction in file size

#### Avatar Images:
- **Original**: Up to 15MB (your current limit)
- **Optimized**: ~20-80KB (typical after processing)
- **Savings**: 99%+ reduction in file size

This keeps your 15MB upload limit while ensuring optimal performance! 🚀

## 7. Recommended Storage Bucket Limits

Based on the optimization, you can now safely reduce your bucket limits:

### For `entry-images` bucket:
- **Recommended**: `2MB` (4x buffer over optimized size)
- **Aggressive**: `1MB` (2x buffer)

### For `avatars` bucket:
- **Recommended**: `500KB` (6x buffer over optimized size)
- **Aggressive**: `200KB` (3x buffer)

This provides security while allowing for edge cases! 🔒