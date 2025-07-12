# Complete Storage Setup Guide

Since `storage.objects` is managed by Supabase internally, you need to configure storage through the dashboard UI.

## Step 1: Create Required Storage Buckets

Go to your Supabase project: https://xtukypwzqnhqyufavenn.supabase.co

### Create `entry-images` bucket:
1. Navigate to **Storage** → **Buckets**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `entry-images`
   - **Public bucket**: ✅ **ENABLED**
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

### Create `avatars` bucket:
1. Click **"New bucket"** again
2. Configure:
   - **Name**: `avatars` 
   - **Public bucket**: ✅ **ENABLED**
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

## Step 2: Configure Storage Policies

### Option A: Disable RLS (Simplest)
1. Go to **Storage** → **Policies**
2. Find the **Storage** section
3. Look for **Row Level Security** toggle
4. **Disable RLS** for storage operations

### Option B: Create Permissive Policies (If RLS must stay enabled)
If you need to keep RLS enabled, create these policies:

#### For all buckets - Allow authenticated users:
1. Go to **Storage** → **Policies**
2. Click **"New Policy"**
3. Configure:
   - **Policy name**: `Allow authenticated storage access`
   - **Allowed operation**: `ALL`
   - **Target roles**: `authenticated`
   - **Policy definition**: Leave empty or use `true`

## Step 3: Test Storage Access

After setup, test by:
1. Uploading an avatar in your app
2. Uploading a photo entry
3. Check console for any RLS errors

## Expected Result

Both buckets should be:
- ✅ Created and public
- ✅ Accessible by authenticated users
- ✅ Ready for file uploads

If you still get RLS errors after this setup, storage policies need to be configured through Supabase support or documentation.