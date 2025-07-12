import { ensureUserProfile } from '../userProfileService';
import { supabase } from '../../config/supabase';

// Mock the supabase client
jest.mock('../../config/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('userProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureUserProfile', () => {
    it('should create user profile when it does not exist', async () => {
      // Mock that profile doesn't exist
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' }
        }),
        upsert: jest.fn().mockReturnThis(),
      } as any);

      // Mock successful upsert
      const mockUpsert = jest.fn().mockResolvedValue({
        data: { id: 'test-user-id', email: 'test@example.com' },
        error: null
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' }
        }),
      } as any).mockReturnValueOnce({
        upsert: mockUpsert,
      } as any);

      await ensureUserProfile('test-user-id', 'test@example.com');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpsert).toHaveBeenCalledWith({
        id: 'test-user-id',
        email: 'test@example.com',
        display_name: 'test@example.com',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should not create profile when it already exists', async () => {
      // Mock that profile exists
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-user-id', email: 'test@example.com' },
          error: null
        }),
      } as any);

      await ensureUserProfile('test-user-id', 'test@example.com');

      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection error' }
        }),
        upsert: jest.fn().mockReturnThis(),
      } as any);

      const mockUpsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' }
        }),
      } as any).mockReturnValueOnce({
        upsert: mockUpsert,
      } as any);

      await expect(ensureUserProfile('test-user-id', 'test@example.com'))
        .rejects.toThrow('Insert failed');
    });

    it('should retry on race condition errors', async () => {
      let callCount = 0;
      
      // Mock first call fails, second succeeds
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: callCount++ > 0 ? { id: 'test-user-id' } : null,
          error: callCount > 1 ? null : { message: 'No rows returned' }
        }),
        upsert: jest.fn().mockReturnThis(),
      } as any));

      const mockUpsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' }
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' }
        }),
      } as any).mockReturnValueOnce({
        upsert: mockUpsert,
      } as any);

      await ensureUserProfile('test-user-id', 'test@example.com');

      expect(mockSupabase.from).toHaveBeenCalledTimes(3); // Initial check, upsert attempt, retry check
    });

    it('should handle invalid email gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' }
        }),
        upsert: jest.fn().mockReturnThis(),
      } as any);

      const mockUpsert = jest.fn().mockResolvedValue({
        data: { id: 'test-user-id', email: '' },
        error: null
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows returned' }
        }),
      } as any).mockReturnValueOnce({
        upsert: mockUpsert,
      } as any);

      await ensureUserProfile('test-user-id', '');

      expect(mockUpsert).toHaveBeenCalledWith({
        id: 'test-user-id',
        email: '',
        display_name: 'Anonymous User',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should handle concurrent calls efficiently', async () => {
      // Mock that profile doesn't exist initially
      let profileExists = false;
      
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: profileExists ? { id: 'test-user-id' } : null,
          error: profileExists ? null : { message: 'No rows returned' }
        }),
        upsert: jest.fn().mockImplementation(() => {
          profileExists = true;
          return Promise.resolve({
            data: { id: 'test-user-id', email: 'test@example.com' },
            error: null
          });
        }),
      } as any));

      // Make multiple concurrent calls
      const promises = [
        ensureUserProfile('test-user-id', 'test@example.com'),
        ensureUserProfile('test-user-id', 'test@example.com'),
        ensureUserProfile('test-user-id', 'test@example.com'),
      ];

      await Promise.all(promises);

      // Should have been called multiple times but handled gracefully
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});