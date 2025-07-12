import { store } from '../store';
import { supabase } from '../config/supabase';
import { 
  updateActionStatus, 
  removePendingAction, 
  incrementRetryCount,
  setSyncStatus,
  setLastSyncTime 
} from '../store/slices/offlineSlice';
import { uploadAudioToSupabase } from '../utils/audioUpload';
import { AIService } from './ai';
import { addEntry } from '../store/slices/entriesSlice';

const MAX_RETRY_COUNT = 3;
const aiService = new AIService();

export async function syncOfflineQueue() {
  const state = store.getState();
  const { pendingActions, isOnline } = state.offline;
  
  if (!isOnline || pendingActions.length === 0) {
    return;
  }
  
  console.log('🔄 Starting offline sync...', pendingActions.length, 'pending actions');
  store.dispatch(setSyncStatus('syncing'));
  
  for (const action of pendingActions) {
    // Skip if already syncing or failed too many times
    if (action.status === 'syncing' || action.retryCount >= MAX_RETRY_COUNT) {
      continue;
    }
    
    try {
      store.dispatch(updateActionStatus({ id: action.id, status: 'syncing' }));
      
      switch (action.type) {
        case 'CREATE_ENTRY':
          await syncCreateEntry(action);
          break;
          
        case 'UPDATE_ENTRY':
          await syncUpdateEntry(action);
          break;
          
        case 'DELETE_ENTRY':
          await syncDeleteEntry(action);
          break;
          
        case 'UPLOAD_AUDIO':
          await syncUploadAudio(action);
          break;
          
        case 'UPLOAD_IMAGE':
          await syncUploadImage(action);
          break;
          
        default:
          console.warn('Unknown action type:', action.type);
      }
      
      // Success - remove from queue
      store.dispatch(removePendingAction(action.id));
      
    } catch (error) {
      console.error('❌ Sync failed for action:', action.id, error);
      
      store.dispatch(incrementRetryCount(action.id));
      store.dispatch(updateActionStatus({ 
        id: action.id, 
        status: 'failed',
        error: error.message || 'Sync failed'
      }));
    }
  }
  
  store.dispatch(setSyncStatus('idle'));
  store.dispatch(setLastSyncTime(new Date().toISOString()));
  console.log('✅ Offline sync completed');
}

async function syncCreateEntry(action: any) {
  const { audioUri, transcription, category, userId, localId } = action.payload;
  
  let audioUrl = null;
  let aiResponse = '';
  
  // Upload audio if present
  if (audioUri && audioUri.startsWith('file://')) {
    audioUrl = await uploadAudioToSupabase(audioUri, userId);
  }
  
  // Get AI response if we have transcription
  if (transcription) {
    try {
      aiResponse = await aiService.generateResponse(transcription, category, {
        currentStreak: 0
      });
    } catch (error) {
      console.warn('AI response failed, using fallback');
      aiResponse = `Thank you for sharing what's going well in ${category}! Your reflection shows real awareness and gratitude.`;
    }
  }
  
  // Create entry in database
  const { data, error } = await supabase
    .from('daily_entries')
    .insert([{
      user_id: userId,
      transcription,
      ai_response: aiResponse,
      category,
      audio_url: audioUrl,
      created_at: action.timestamp,
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  // Update local Redux store with the real entry
  store.dispatch(addEntry(data));
}

async function syncUpdateEntry(action: any) {
  const { entryId, updates } = action.payload;
  
  const { error } = await supabase
    .from('daily_entries')
    .update(updates)
    .eq('id', entryId);
  
  if (error) throw error;
}

async function syncDeleteEntry(action: any) {
  const { entryId } = action.payload;
  
  const { error } = await supabase
    .from('daily_entries')
    .delete()
    .eq('id', entryId);
  
  if (error) throw error;
}

async function syncUploadAudio(action: any) {
  const { audioUri, userId, entryId } = action.payload;
  
  const audioUrl = await uploadAudioToSupabase(audioUri, userId);
  
  if (audioUrl && entryId) {
    const { error } = await supabase
      .from('daily_entries')
      .update({ audio_url: audioUrl })
      .eq('id', entryId);
    
    if (error) throw error;
  }
}

async function syncUploadImage(action: any) {
  const { imageUri, userId } = action.payload;
  
  // TODO: Implement image upload when needed
  console.log('Image upload sync not yet implemented');
}