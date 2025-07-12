import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { store } from '../store';
import { setOnlineStatus } from '../store/slices/offlineSlice';

class NetworkService {
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🌐 Initializing network service...');
    
    // Get initial network state
    const state = await NetInfo.fetch();
    this.handleConnectivityChange(state);
    
    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.handleConnectivityChange(state);
    });
    
    this.isInitialized = true;
  }

  private handleConnectivityChange(state: NetInfoState) {
    const isOnline = state.isConnected && state.isInternetReachable !== false;
    
    console.log('🌐 Network state changed:', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isOnline
    });
    
    // Update Redux store
    store.dispatch(setOnlineStatus(isOnline));
    
    // If coming back online, trigger sync
    if (isOnline) {
      this.triggerSync();
    }
  }

  private async triggerSync() {
    // Import dynamically to avoid circular dependency
    const { syncOfflineQueue } = await import('./offlineSyncService');
    
    // Small delay to ensure network is stable
    setTimeout(() => {
      console.log('📱 Network restored, triggering sync...');
      syncOfflineQueue();
    }, 2000);
  }

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
  }
}

export const networkService = new NetworkService();