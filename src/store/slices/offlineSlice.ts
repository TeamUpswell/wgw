import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OfflineAction {
  id: string;
  type: 'CREATE_ENTRY' | 'UPDATE_ENTRY' | 'DELETE_ENTRY' | 'UPLOAD_AUDIO' | 'UPLOAD_IMAGE';
  payload: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

interface OfflineState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: string | null;
}

const initialState: OfflineState = {
  isOnline: true,
  pendingActions: [],
  syncStatus: 'idle',
  lastSyncTime: null,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload && state.pendingActions.length > 0) {
        // Coming back online with pending actions
        state.syncStatus = 'idle'; // Will trigger sync
      }
    },
    
    addPendingAction: (state, action: PayloadAction<Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>>) => {
      const newAction: OfflineAction = {
        ...action.payload,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
      };
      state.pendingActions.push(newAction);
    },
    
    updateActionStatus: (state, action: PayloadAction<{ id: string; status: OfflineAction['status']; error?: string }>) => {
      const actionIndex = state.pendingActions.findIndex(a => a.id === action.payload.id);
      if (actionIndex !== -1) {
        state.pendingActions[actionIndex].status = action.payload.status;
        if (action.payload.error) {
          state.pendingActions[actionIndex].error = action.payload.error;
        }
      }
    },
    
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const actionIndex = state.pendingActions.findIndex(a => a.id === action.payload);
      if (actionIndex !== -1) {
        state.pendingActions[actionIndex].retryCount++;
      }
    },
    
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(a => a.id !== action.payload);
    },
    
    setSyncStatus: (state, action: PayloadAction<OfflineState['syncStatus']>) => {
      state.syncStatus = action.payload;
    },
    
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    
    clearFailedActions: (state) => {
      state.pendingActions = state.pendingActions.filter(a => a.status !== 'failed');
    },
  },
});

export const {
  setOnlineStatus,
  addPendingAction,
  updateActionStatus,
  incrementRetryCount,
  removePendingAction,
  setSyncStatus,
  setLastSyncTime,
  clearFailedActions,
} = offlineSlice.actions;

export default offlineSlice.reducer;