import { supabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system';

export async function uploadAudioToSupabase(
  audioUri: string,
  userId: string
): Promise<string | null> {
  try {
    console.log('🎵 Starting audio upload...');
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.m4a`;
    
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to blob
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/m4a' });
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .upload(fileName, blob, {
        contentType: 'audio/m4a',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Audio upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(fileName);
    
    console.log('✅ Audio uploaded successfully:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Audio upload failed:', error);
    return null;
  }
}