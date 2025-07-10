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

export async function checkAvatarsBucket() {
  try {
    console.log('🪣 Checking entry-images bucket...');
    
    // Get bucket info
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Failed to list buckets:', error);
      return { exists: false, error: error.message };
    }
    
    const entryImagesBucket = buckets?.find(bucket => bucket.name === 'entry-images');
    
    if (!entryImagesBucket) {
      console.error('❌ Entry-images bucket not found');
      console.log('📋 Available buckets:', buckets?.map(b => b.name));
      return { exists: false, error: 'Entry-images bucket not found' };
    }
    
    console.log('✅ Entry-images bucket found:', entryImagesBucket);
    return { exists: true, bucket: entryImagesBucket };
    
  } catch (error) {
    console.error('💥 Bucket check error:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}