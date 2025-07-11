# Database Schema Setup

This directory contains all the SQL schema files for the What's Going Well app.

## Setup Order

Run these SQL files in your Supabase SQL editor in the following order:

1. **00-main-schema.sql** - Core tables (users, daily_entries, groups)
2. **user-codes-schema.sql** - User code system for sharing
3. **invites-schema.sql** - Email/SMS invitation system
4. **social-features-schema.sql** - Likes and comments
5. **notifications-schema.sql** - Notification preferences
6. **notification-templates-schema.sql** - Notification templates

## Important Notes

- The `users` table is separate from Supabase's `auth.users` table
- A trigger automatically creates a user profile when someone signs up
- All tables have Row Level Security (RLS) enabled
- Make sure to run these files in order as later files depend on earlier ones

## Troubleshooting

If you get a "Database error saving new user" error during signup:

1. Check that all schema files have been run
2. Verify the `handle_new_user()` trigger is active
3. Check Supabase logs for specific error messages
4. Ensure RLS policies are properly configured

## Table Overview

- **users** - User profiles with display names, avatars, etc.
- **daily_entries** - Daily journal entries
- **groups** - User groups for sharing
- **group_members** - Group membership
- **group_settings** - Per-user group sharing preferences
- **user_codes** - Shareable codes for following users
- **follow_requests** - Pending follow requests
- **invites** - Email/SMS invitations
- **likes** - Entry likes
- **comments** - Entry comments
- **notification_settings** - User notification preferences
- **notification_templates** - Custom notification templates