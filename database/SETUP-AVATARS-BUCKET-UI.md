# Setup Avatars Bucket via Supabase Dashboard

Since you don't have owner permissions to modify RLS policies via SQL, follow these steps to set up the avatars bucket through the Supabase dashboard:

## Option 1: Create Avatars Bucket (Recommended)

1. **Go to Storage in Supabase Dashboard**
   - Navigate to your Supabase project
   - Click on "Storage" in the left sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - Name: `avatars`
   - Public bucket: ✅ (checked)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`

3. **Set up Policies**
   - Go to Storage > Policies
   - Click "New policy" for the avatars bucket
   - Create these policies:

   **Policy 1: Upload Policy**
   - Name: `Users can upload avatars`
   - Operation: INSERT
   - Target roles: `authenticated`
   - USING expression: `bucket_id = 'avatars'`

   **Policy 2: Read Policy**  
   - Name: `Anyone can view avatars`
   - Operation: SELECT
   - Target roles: `public`
   - USING expression: `bucket_id = 'avatars'`

   **Policy 3: Update Policy**
   - Name: `Users can update avatars` 
   - Operation: UPDATE
   - Target roles: `authenticated`
   - USING expression: `bucket_id = 'avatars'`

   **Policy 4: Delete Policy**
   - Name: `Users can delete avatars`
   - Operation: DELETE  
   - Target roles: `authenticated`
   - USING expression: `bucket_id = 'avatars'`

## Option 2: Use Existing entry-images Bucket (Fallback)

If you can't create the avatars bucket, the app will automatically fall back to using the `entry-images` bucket with an `avatars/` folder structure. This should work with your existing permissions.

## Testing

After setting up either option, test avatar upload in the app. Check the logs to see which bucket is being used:

- ✅ `Starting Supabase storage upload to avatars bucket...`
- ⚠️ `Avatars bucket not found, falling back to entry-images bucket...`

The app is designed to work with both configurations.