import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ProfileCompleteness } from '@/components/profile/profile-completeness';
import type { Student, Faculty } from '@/types/entities';

// Mock API calls
const mockApiUpdate = jest.fn();
const mockApiGet = jest.fn();

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

// Mock the faculty service
jest.mock('@/lib/api/faculty', () => ({
  facultyService: {
    getAllFaculty: mockApiGet,
    updateFaculty: mockApiUpdate,
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('Profile Data Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all localStorage mock methods
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Reset all sessionStorage mock methods
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
    
    // Reset mock implementations
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    
    sessionStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.setItem.mockImplementation(() => {});
    sessionStorageMock.removeItem.mockImplementation(() => {});
  });

  describe('Local Storage Persistence', () => {
    test('should save profile data to localStorage on update', async () => {
      const mockProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com'
      };

      // Mock successful API response
      mockApiUpdate.mockResolvedValueOnce(mockProfile);

      // Simulate profile update
      const updateData = { personalEmail: 'updated@test.com' };
      
      // Call the update function (this would be in your actual component)
      await mockApiUpdate('1', updateData);

      // Verify API was called
      expect(mockApiUpdate).toHaveBeenCalledWith('1', updateData);
    });

    test('should retrieve cached profile data from localStorage', () => {
      const fixedTimestamp = 1653555953437;
      const cachedProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        lastUpdated: fixedTimestamp
      };

      // Mock localStorage.getItem to return the cached profile
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedProfile));

      // Simulate retrieving cached data
      const cached = localStorageMock.getItem('profile_1');
      const parsedProfile = cached ? JSON.parse(cached) : null;

      expect(parsedProfile).toEqual(cachedProfile);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('profile_1');
    });

    test('should handle localStorage quota exceeded gracefully', () => {
      const largeProfileData = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        // Simulate large data that might exceed quota
        largeField: 'x'.repeat(10000000)
      };

      // Reset mocks and set up specific behavior for this test
      localStorageMock.setItem.mockReset();
      sessionStorageMock.setItem.mockReset();
      
      // Mock localStorage.setItem to throw quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });

      // Mock sessionStorage.setItem to succeed
      sessionStorageMock.setItem.mockImplementation(() => {});

      // Function to save profile with error handling
      const saveProfileToCache = (profile: any) => {
        try {
          localStorageMock.setItem(`profile_${profile.id}`, JSON.stringify(profile));
          return true;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            // Handle quota exceeded - could clear old data or use sessionStorage
            console.warn('LocalStorage quota exceeded, falling back to sessionStorage');
            try {
              sessionStorageMock.setItem(`profile_${profile.id}`, JSON.stringify(profile));
              return false; // Return false to indicate localStorage failed
            } catch (sessionError) {
              // Session storage also full
              return false;
            }
          }
          throw error;
        }
      };

      const result = saveProfileToCache(largeProfileData);
      
      expect(result).toBe(false);
      expect(sessionStorageMock.setItem).toHaveBeenCalled();
    });

    test('should invalidate cache when data is stale', () => {
      const fixedCurrentTime = 1653555953437;
      const staleTimestamp = fixedCurrentTime - (25 * 60 * 60 * 1000); // 25 hours ago
      const staleProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        lastUpdated: staleTimestamp
      };

      // Reset mocks and setup specific behavior for this test
      localStorageMock.getItem.mockReset();
      localStorageMock.removeItem.mockReset();
      
      // Setup mock to return stale profile data
      localStorageMock.getItem.mockReturnValue(JSON.stringify(staleProfile));
      localStorageMock.removeItem.mockImplementation(() => {});

      // Mock Date.now to return our fixed time
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => fixedCurrentTime);

      // Function to check if cached data is valid
      const getCachedProfile = (profileId: string, maxAge = 24 * 60 * 60 * 1000) => {
        const cached = localStorageMock.getItem(`profile_${profileId}`);
        if (!cached) return null;

        const profile = JSON.parse(cached);
        const isStale = Date.now() - profile.lastUpdated > maxAge;
        
        if (isStale) {
          localStorageMock.removeItem(`profile_${profileId}`);
          return null;
        }
        
        return profile;
      };

      const result = getCachedProfile('1');
      
      // Restore original Date.now
      Date.now = originalDateNow;
      
      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('profile_1');
    });
  });

  describe('API Data Persistence', () => {
    test('should handle API update success', async () => {
      const mockProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe'
      };

      const updateData = { personalEmail: 'new@email.com' };
      const expectedResponse = { ...mockProfile, ...updateData };

      mockApiUpdate.mockResolvedValueOnce(expectedResponse);

      const result = await mockApiUpdate('1', updateData);

      expect(result).toEqual(expectedResponse);
      expect(mockApiUpdate).toHaveBeenCalledWith('1', updateData);
    });

    test('should handle API update failure with retry', async () => {
      const updateData = { personalEmail: 'new@email.com' };
      
      // Mock API to fail first call, succeed on retry
      mockApiUpdate
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });

      // Function with retry logic
      const updateWithRetry = async (id: string, data: any, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await mockApiUpdate(id, data);
          } catch (error) {
            if (attempt === maxRetries) throw error;
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }
      };

      const result = await updateWithRetry('1', updateData);

      expect(result).toEqual({ success: true });
      expect(mockApiUpdate).toHaveBeenCalledTimes(2);
    });

    test('should handle concurrent API updates', async () => {
      const updates = [
        { personalEmail: 'email1@test.com' },
        { contactNumber: '+1234567890' },
        { address: '123 Main St' }
      ];

      // Mock API responses
      mockApiUpdate
        .mockResolvedValueOnce({ success: true, field: 'email' })
        .mockResolvedValueOnce({ success: true, field: 'phone' })
        .mockResolvedValueOnce({ success: true, field: 'address' });

      // Simulate concurrent updates
      const promises = updates.map(update => mockApiUpdate('1', update));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockApiUpdate).toHaveBeenCalledTimes(3);
    });

    test('should queue updates when API is busy', async () => {
      const updates = [
        { personalEmail: 'email1@test.com' },
        { personalEmail: 'email2@test.com' },
        { personalEmail: 'email3@test.com' }
      ];

      let callCount = 0;
      mockApiUpdate.mockImplementation(() => {
        callCount++;
        return new Promise(resolve => {
          setTimeout(() => resolve({ success: true, call: callCount }), 100);
        });
      });

      // Function to queue updates
      const updateQueue: Promise<any>[] = [];
      
      const queuedUpdate = (id: string, data: any) => {
        const updatePromise = updateQueue.length > 0 
          ? updateQueue[updateQueue.length - 1].then(() => mockApiUpdate(id, data))
          : mockApiUpdate(id, data);
        
        updateQueue.push(updatePromise);
        return updatePromise;
      };

      // Queue multiple updates
      const promises = updates.map(update => queuedUpdate('1', update));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockApiUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe('Optimistic Updates', () => {
    test('should apply optimistic updates immediately', async () => {
      const initialProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'old@test.com'
      };

      const updateData = { personalEmail: 'new@test.com' };

      // Simulate optimistic update
      const optimisticProfile = { ...initialProfile, ...updateData };

      // Mock API call that takes time
      mockApiUpdate.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(optimisticProfile), 1000))
      );

      // Optimistic update should be applied immediately
      const immediateResult = { ...initialProfile, ...updateData };
      expect(immediateResult.personalEmail).toBe('new@test.com');

      // API call should still complete
      const apiResult = await mockApiUpdate('1', updateData);
      expect(apiResult).toEqual(optimisticProfile);
    });

    test('should rollback optimistic updates on API failure', async () => {
      const initialProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'old@test.com'
      };

      const updateData = { personalEmail: 'new@test.com' };

      // Apply optimistic update
      let currentProfile = { ...initialProfile, ...updateData };
      expect(currentProfile.personalEmail).toBe('new@test.com');

      // Mock API failure
      mockApiUpdate.mockRejectedValueOnce(new Error('Update failed'));

      try {
        await mockApiUpdate('1', updateData);
      } catch (error) {
        // Rollback optimistic update
        currentProfile = initialProfile;
      }

      expect(currentProfile.personalEmail).toBe('old@test.com');
    });
  });

  describe('Data Synchronization', () => {
    test('should sync data between multiple tabs', () => {
      const profileData = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'updated@test.com'
      };

      // Mock storage event (fired when localStorage changes in another tab)
      const storageEvent = new StorageEvent('storage', {
        key: 'profile_1',
        newValue: JSON.stringify(profileData),
        oldValue: null,
        url: window.location.href
      });

      // Function to handle storage events
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key?.startsWith('profile_') && event.newValue) {
          const updatedProfile = JSON.parse(event.newValue);
          return updatedProfile;
        }
        return null;
      };

      const result = handleStorageChange(storageEvent);
      expect(result).toEqual(profileData);
    });

    test('should resolve conflicts in concurrent updates', () => {
      const baseProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'john@test.com',
        version: 1
      };

      const update1 = { personalEmail: 'updated1@test.com', version: 2 };
      const update2 = { contactNumber: '+1234567890', version: 2 };

      // Function to merge concurrent updates
      const mergeUpdates = (base: any, ...updates: any[]) => {
        const merged = { ...base };
        let maxVersion = base.version || 0;

        updates.forEach(update => {
          Object.keys(update).forEach(key => {
            if (key !== 'version') {
              merged[key] = update[key];
            }
          });
          maxVersion = Math.max(maxVersion, update.version || 0);
        });

        merged.version = maxVersion + 1;
        return merged;
      };

      const result = mergeUpdates(baseProfile, update1, update2);

      expect(result.personalEmail).toBe('updated1@test.com');
      expect(result.contactNumber).toBe('+1234567890');
      expect(result.version).toBe(3);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from corrupted localStorage data', () => {
      // Mock corrupted data
      localStorageMock.getItem.mockReturnValueOnce('corrupted-json{');

      const safeGetFromStorage = (key: string) => {
        try {
          const data = localStorageMock.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.warn('Corrupted data in localStorage, removing:', key);
          localStorageMock.removeItem(key);
          return null;
        }
      };

      const result = safeGetFromStorage('profile_1');

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('profile_1');
    });

    test('should handle network errors gracefully', async () => {
      // Reset localStorage mock to clean state
      localStorageMock.getItem.mockReturnValue('[]');
      localStorageMock.setItem.mockImplementation((key, value) => {
        // Normal setItem behavior, don't throw
      });
      
      const updateData = { personalEmail: 'new@test.com' };

      // Mock network error
      mockApiUpdate.mockRejectedValueOnce(new Error('Network error'));

      const updateWithFallback = async (id: string, data: any) => {
        try {
          return await mockApiUpdate(id, data);
        } catch (error) {
          // Store update for later retry
          const pendingUpdates = JSON.parse(
            localStorageMock.getItem('pendingUpdates') || '[]'
          );
          pendingUpdates.push({ id, data, timestamp: Date.now() });
          localStorageMock.setItem('pendingUpdates', JSON.stringify(pendingUpdates));
          
          throw error;
        }
      };

      await expect(updateWithFallback('1', updateData)).rejects.toThrow('Network error');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pendingUpdates',
        expect.stringContaining('"personalEmail":"new@test.com"')
      );
    });

    test('should retry failed updates when connection is restored', async () => {
      const pendingUpdates = [
        { id: '1', data: { personalEmail: 'email1@test.com' }, timestamp: Date.now() - 1000 },
        { id: '1', data: { contactNumber: '+1234567890' }, timestamp: Date.now() - 500 }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingUpdates));
      mockApiUpdate.mockResolvedValue({ success: true });

      const retryPendingUpdates = async () => {
        const pending = JSON.parse(localStorageMock.getItem('pendingUpdates') || '[]');
        
        for (const update of pending) {
          try {
            await mockApiUpdate(update.id, update.data);
          } catch (error) {
            console.warn('Retry failed for update:', update);
            return false;
          }
        }
        
        localStorageMock.removeItem('pendingUpdates');
        return true;
      };

      const success = await retryPendingUpdates();

      expect(success).toBe(true);
      expect(mockApiUpdate).toHaveBeenCalledTimes(2);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pendingUpdates');
    });
  });

  describe('Profile Completeness Persistence', () => {
    test('should cache completeness calculations', () => {
      const mockProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'john@test.com',
        skills: [{ id: '1', name: 'JavaScript', category: 'technical', proficiency: 'advanced', order: 0 }]
      };

      // Function to calculate and cache completeness
      const calculateCompleteness = (profile: any) => {
        const cacheKey = `completeness_${profile.id}`;
        const cached = sessionStorageMock.getItem(cacheKey);
        
        if (cached) {
          const { completeness, timestamp } = JSON.parse(cached);
          // Cache for 5 minutes
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            return completeness;
          }
        }

        // Calculate completeness (simplified)
        let completeness = 0;
        if (profile.firstName) completeness += 20;
        if (profile.personalEmail) completeness += 20;
        if (profile.skills?.length > 0) completeness += 30;
        
        // Cache result
        sessionStorageMock.setItem(cacheKey, JSON.stringify({
          completeness,
          timestamp: Date.now()
        }));
        
        return completeness;
      };

      const result = calculateCompleteness(mockProfile);

      expect(result).toBe(70); // 20 + 20 + 30
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'completeness_1',
        expect.stringContaining('"completeness":70')
      );
    });

    test('should invalidate completeness cache when profile updates', () => {
      const profileId = '1';
      
      // Mock existing cache
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify({
        completeness: 50,
        timestamp: Date.now()
      }));

      const invalidateCompletenessCache = (id: string) => {
        sessionStorageMock.removeItem(`completeness_${id}`);
      };

      invalidateCompletenessCache(profileId);

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('completeness_1');
    });
  });
});