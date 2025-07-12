# Storage Bucket Setup Guide

Since SQL bucket creation requires owner permissions, create the bucket through the Supabase dashboard UI:

## Step 1: Create the Bucket via Dashboard

1. Go to your Supabase project: https://xtukypwzqnhqyufavenn.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `entry-images`
   - **Public bucket**: ✅ **ENABLED** (so images can be viewed via public URLs)
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

## Step 2: Set Up RLS Policies (Optional)

If you want to restrict access, you can set up Row Level Security policies through the dashboard:

1. Go to **Storage** → **Policies**
2. Create policies for the `entry-images` bucket:
   - **SELECT**: Allow authenticated users to view images
   - **INSERT**: Allow authenticated users to upload images
   - **UPDATE**: Allow authenticated users to update images  
   - **DELETE**: Allow authenticated users to delete images

## Step 3: Test the Setup

After creating the bucket, try uploading a photo in the app to verify it works.

## Bucket Configuration Summary

```
Bucket Name: entry-images
Public: Yes
File Size Limit: 50 MB
Allowed Types: image/jpeg, image/jpg, image/png, image/webp
```

This will resolve the "bucket not found" error when uploading photos.