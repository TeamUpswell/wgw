import { supabase } from '../config/supabase';

export async function testStoragePermissions() {
  try {
    console.log('🧪 Testing storage permissions...');
    
    // Test if we can list files in the entry-images bucket
    const { data: listData, error: listError } = await supabase.storage
      .from('entry-images')
      .list('', {
        limit: 1,
      });
    
    if (listError) {
      console.error('❌ List permission test failed:', listError);
      return {
        canList: false,
        error: listError.message,
      };
    }
    
    console.log('✅ List permission test passed:', listData);
    
    // Test if we can upload a small test file
    const testFileName = `test_${Date.now()}.txt`;
    const testContent = 'test content';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('entry-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      });
    
    if (uploadError) {
      console.error('❌ Upload permission test failed:', uploadError);
      return {
        canList: true,
        canUpload: false,
        error: uploadError.message,
      };
    }
    
    console.log('✅ Upload permission test passed:', uploadData);
    
    // Clean up test file
    await supabase.storage
      .from('entry-images')
      .remove([testFileName]);
    
    console.log('🧹 Test file cleaned up');
    
    return {
      canList: true,
      canUpload: true,
      success: true,
    };
    
  } catch (error) {
    console.error('💥 Storage test error:', error);
    return {
      canList: false,
      canUpload: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function testAvatarPermissions(userId: string) {
  try {
    console.log('🧪 Testing avatar storage permissions...');
    
    // Test if we can list files in the avatars bucket
    const { data: listData, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId, {
        limit: 1,
      });
    
    if (listError) {
      console.error('❌ Avatar list permission test failed:', listError);
      return {
        canList: false,
        error: listError.message,
      };
    }
    
    console.log('✅ Avatar list permission test passed:', listData);
    
    // Test if we can upload a small test file to user's folder
    const testFileName = `${userId}/test_${Date.now()}.txt`;
    const testContent = 'test avatar content';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      });
    
    if (uploadError) {
      console.error('❌ Avatar upload permission test failed:', uploadError);
      return {
        canList: true,
        canUpload: false,
        error: uploadError.message,
      };
    }
    
    console.log('✅ Avatar upload permission test passed:', uploadData);
    
    // Clean up test file
    await supabase.storage
      .from('avatars')
      .remove([testFileName]);
    
    console.log('🧹 Avatar test file cleaned up');
    
    return {
      canList: true,
      canUpload: true,
      success: true,
    };
    
  } catch (error) {
    console.error('💥 Avatar storage test error:', error);
    return {
      canList: false,
      canUpload: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkAvatarsBucket() {
  try {
    console.log('🪣 Checking avatars bucket...');
    
    // Get bucket info
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Failed to list buckets:', error);
      return { exists: false, error: error.message };
    }
    
    console.log('📋 Available buckets:', buckets?.map(b => b.name));
    
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    const entryImagesBucket = buckets?.find(bucket => bucket.name === 'entry-images');
    
    if (!avatarsBucket) {
      console.error('❌ Avatars bucket not found');
      return { 
        exists: false, 
        error: 'Avatars bucket not found',
        hasEntryImages: !!entryImagesBucket,
        availableBuckets: buckets?.map(b => b.name) || []
      };
    }
    
    console.log('✅ Avatars bucket found:', avatarsBucket);
    return { 
      exists: true, 
      bucket: avatarsBucket,
      hasEntryImages: !!entryImagesBucket 
    };
    
  } catch (error) {
    console.error('💥 Bucket check error:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}