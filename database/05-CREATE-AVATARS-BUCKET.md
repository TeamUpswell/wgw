# Create Avatars Storage Bucket

## Step 1: Create Avatars Bucket via Supabase Dashboard

1. Go to your Supabase project: https://xtukypwzqnhqyufavenn.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **ENABLED** (so avatars can be viewed via public URLs)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

## Step 2: Disable RLS for Storage (Quick Fix)

Since you don't have SQL permissions to create proper policies, disable RLS through the dashboard:

1. Go to **Database** → **Tables**
2. Find the `storage.objects` table in the storage schema
3. Click on the table
4. Go to **Settings** or **RLS** tab
5. **Disable Row Level Security** for this table

## Alternative: Create Basic Policies (if RLS settings available)

If you can create policies through the dashboard:

### For `entry-images` bucket:
- **Policy name**: `Allow all operations on entry-images`
- **Allowed operation**: `ALL`
- **Target roles**: `authenticated`
- **USING expression**: `bucket_id = 'entry-images'`

### For `avatars` bucket:
- **Policy name**: `Allow all operations on avatars`
- **Allowed operation**: `ALL`
- **Target roles**: `authenticated`
- **USING expression**: `bucket_id = 'avatars'`

## Step 3: Test

After creating the avatars bucket and fixing RLS, try uploading an avatar again.

## Bucket Summary

You should now have these buckets:
- `entry-images` (for photo entries)
- `avatars` (for user profile pictures)

Both should be public and have RLS disabled or permissive policies.