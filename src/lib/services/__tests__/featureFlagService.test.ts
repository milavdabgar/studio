import { FeatureFlagService, FeatureFlagConfig, FeatureFlagUser } from '../featureFlagService';
import { MemoryStorage } from '@/lib/storage';

// Mock storage
jest.mock('@/lib/storage');

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('FeatureFlagService', () => {
  let featureFlagService: FeatureFlagService;
  let mockStorage: jest.Mocked<MemoryStorage>;
  
  // Test data
  const testUserId = 'user-123';
  const testUser: FeatureFlagUser = {
    id: testUserId,
    email: 'test@example.com',
    name: 'Test User',
    custom: {
      plan: 'pro',
      signupDate: '2023-01-01',
    },
  };
  
  const testFlags: Record<string, FeatureFlagConfig> = {
    'new-dashboard': {
      description: 'New dashboard design',
      defaultValue: false,
      rules: [
        {
          condition: {
            plan: { $eq: 'pro' },
          },
          value: true,
        },
      ],
    },
    'dark-mode': {
      description: 'Dark mode UI',
      defaultValue: true,
    },
    'beta-feature': {
      description: 'Beta feature',
      defaultValue: false,
      rules: [
        {
          condition: {
            email: { $endsWith: '@example.com' },
          },
          value: true,
        },
      ],
    },
    'experiment-button-color': {
      description: 'Button color experiment',
      defaultValue: 'blue',
      rules: [
        {
          condition: {
            id: { $in: ['user-123', 'user-456'] },
          },
          value: 'red',
          variant: 'treatment',
        },
        {
          condition: {
            id: { $in: ['user-789'] },
          },
          value: 'green',
          variant: 'treatment',
        },
      ],
    },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock storage
    mockStorage = new MemoryStorage() as jest.Mocked<MemoryStorage>;
    
    // Create a new instance for each test
    featureFlagService = new FeatureFlagService({
      storage: mockStorage,
      flags: testFlags,
      logger: mockLogger as any,
    });
  });
  
  describe('initialization', () => {
    it('should initialize with default flags', () => {
      expect(featureFlagService.getFlags()).toEqual(testFlags);
    });
    
    it('should load flags from storage if available', async () => {
      const storedFlags = {
        'new-feature': {
          description: 'New feature',
          defaultValue: false,
        },
      };
      
      mockStorage.getItem.mockResolvedValue(JSON.stringify(storedFlags));
      
      const service = new FeatureFlagService({
        storage: mockStorage,
        logger: mockLogger as any,
      });
      
      await service.initialize();
      
      expect(service.getFlags()).toEqual(storedFlags);
      expect(mockStorage.getItem).toHaveBeenCalledWith('featureFlags');
    });
    
    it('should handle storage errors during initialization', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const service = new FeatureFlagService({
        storage: mockStorage,
        flags: testFlags,
        logger: mockLogger as any,
      });
      
      await service.initialize();
      
      // Should continue with default flags
      expect(service.getFlags()).toEqual(testFlags);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load feature flags from storage',
        expect.any(Error)
      );
    });
  });
  
  describe('evaluating flags', () => {
    it('should return default value when no rules match', async () => {
      const isEnabled = await featureFlagService.isEnabled('dark-mode', testUser);
      expect(isEnabled).toBe(true);
    });
    
    it('should evaluate simple boolean flags', async () => {
      const isEnabled = await featureFlagService.isEnabled('new-dashboard', {
        id: 'user-999',
        custom: { plan: 'free' },
      });
      
      expect(isEnabled).toBe(false);
    });
    
    it('should evaluate rules with conditions', async () => {
      const isEnabled = await featureFlagService.isEnabled('new-dashboard', {
        id: 'user-123',
        custom: { plan: 'pro' },
      });
      
      expect(isEnabled).toBe(true);
    });
    
    it('should return variant values', async () => {
      const variant = await featureFlagService.getVariant('experiment-button-color', {
        id: 'user-123',
      });
      
      expect(variant).toEqual({
        value: 'red',
        variant: 'treatment',
      });
    });
    
    it('should return default variant when no rules match', async () => {
      const variant = await featureFlagService.getVariant('experiment-button-color', {
        id: 'user-999',
      });
      
      expect(variant).toEqual({
        value: 'blue',
        variant: 'control',
      });
    });
    
    it('should handle non-existent flags', async () => {
      const isEnabled = await featureFlagService.isEnabled('non-existent-flag', testUser);
      expect(isEnabled).toBe(false);
      
      const variant = await featureFlagService.getVariant('non-existent-flag', testUser);
      expect(variant).toBeUndefined();
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Feature flag not found: non-existent-flag'
      );
    });
  });
  
  describe('complex conditions', () => {
    it('should evaluate $eq operator', async () => {
      const flag = 'beta-feature';
      
      // Email ends with @example.com
      const result1 = await featureFlagService.isEnabled(flag, {
        email: 'test@example.com',
      });
      expect(result1).toBe(true);
      
      // Email does not match
      const result2 = await featureFlagService.isEnabled(flag, {
        email: 'test@other.com',
      });
      expect(result2).toBe(false);
    });
    
    it('should evaluate $ne operator', async () => {
      const flag = {
        'not-beta': {
          description: 'Not in beta',
          defaultValue: false,
          rules: [
            {
              condition: {
                email: { $ne: 'beta@example.com' },
              },
              value: true,
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      const result1 = await featureFlagService.isEnabled('not-beta', {
        email: 'regular@example.com',
      });
      expect(result1).toBe(true);
      
      const result2 = await featureFlagService.isEnabled('not-beta', {
        email: 'beta@example.com',
      });
      expect(result2).toBe(false);
    });
    
    it('should evaluate $in operator', async () => {
      const flag = 'experiment-button-color';
      
      // User ID is in the list
      const result1 = await featureFlagService.getVariant(flag, { id: 'user-123' });
      expect(result1?.value).toBe('red');
      
      // User ID is not in the list
      const result2 = await featureFlagService.getVariant(flag, { id: 'user-999' });
      expect(result2?.value).toBe('blue');
    });
    
    it('should evaluate $nin operator', async () => {
      const flag = {
        'exclude-beta': {
          description: 'Exclude beta testers',
          defaultValue: true,
          rules: [
            {
              condition: {
                id: { $nin: ['beta-1', 'beta-2'] },
              },
              value: false,
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      // Regular user - should match the rule
      const result1 = await featureFlagService.isEnabled('exclude-beta', { id: 'user-123' });
      expect(result1).toBe(false);
      
      // Beta user - should not match the rule
      const result2 = await featureFlagService.isEnabled('exclude-beta', { id: 'beta-1' });
      expect(result2).toBe(true);
    });
    
    it('should evaluate $gt, $gte, $lt, $lte operators', async () => {
      const flag = {
        'tiered-access': {
          description: 'Tiered access based on user score',
          defaultValue: 'basic',
          rules: [
            {
              condition: {
                'custom.score': { $gte: 1000 },
              },
              value: 'platinum',
            },
            {
              condition: {
                'custom.score': { $gte: 500, $lt: 1000 },
              },
              value: 'gold',
            },
            {
              condition: {
                'custom.score': { $gt: 0, $lt: 500 },
              },
              value: 'silver',
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      const platinumUser = { custom: { score: 1200 } };
      const goldUser = { custom: { score: 750 } };
      const silverUser = { custom: { score: 250 } };
      const basicUser = { custom: { score: 0 } };
      
      const result1 = await featureFlagService.getVariant('tiered-access', platinumUser);
      expect(result1?.value).toBe('platinum');
      
      const result2 = await featureFlagService.getVariant('tiered-access', goldUser);
      expect(result2?.value).toBe('gold');
      
      const result3 = await featureFlagService.getVariant('tiered-access', silverUser);
      expect(result3?.value).toBe('silver');
      
      const result4 = await featureFlagService.getVariant('tiered-access', basicUser);
      expect(result4?.value).toBe('basic');
    });
    
    it('should evaluate $exists operator', async () => {
      const flag = {
        'has-avatar': {
          description: 'User has uploaded an avatar',
          defaultValue: false,
          rules: [
            {
              condition: {
                'custom.avatarUrl': { $exists: true },
              },
              value: true,
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      const withAvatar = { custom: { avatarUrl: 'https://example.com/avatar.jpg' } };
      const withoutAvatar = { custom: {} };
      
      const result1 = await featureFlagService.isEnabled('has-avatar', withAvatar);
      expect(result1).toBe(true);
      
      const result2 = await featureFlagService.isEnabled('has-avatar', withoutAvatar);
      expect(result2).toBe(false);
    });
    
    it('should evaluate $regex operator', async () => {
      const flag = {
        'internal-users': {
          description: 'Internal company users',
          defaultValue: false,
          rules: [
            {
              condition: {
                email: { $regex: '@company\\.com$' },
              },
              value: true,
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      const companyUser = { email: 'user@company.com' };
      const externalUser = { email: 'user@gmail.com' };
      
      const result1 = await featureFlagService.isEnabled('internal-users', companyUser);
      expect(result1).toBe(true);
      
      const result2 = await featureFlagService.isEnabled('internal-users', externalUser);
      expect(result2).toBe(false);
    });
  });
  
  describe('updating flags', () => {
    it('should update flags', async () => {
      const newFlags = {
        ...testFlags,
        'new-feature': {
          description: 'Brand new feature',
          defaultValue: false,
        },
      };
      
      await featureFlagService.updateFlags(newFlags);
      
      expect(featureFlagService.getFlags()).toEqual(newFlags);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'featureFlags',
        JSON.stringify(newFlags)
      );
    });
    
    it('should handle storage errors when updating flags', async () => {
      const error = new Error('Storage error');
      mockStorage.setItem.mockRejectedValue(error);
      
      await expect(featureFlagService.updateFlags({})).rejects.toThrow('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save feature flags',
        error
      );
    });
  });
  
  describe('bulk operations', () => {
    it('should get multiple flags at once', async () => {
      const results = await featureFlagService.getAllFlags({
        id: 'user-123',
        custom: { plan: 'pro' },
        email: 'test@example.com',
      });
      
      expect(results).toEqual({
        'new-dashboard': true,
        'dark-mode': true,
        'beta-feature': true,
        'experiment-button-color': {
          value: 'red',
          variant: 'treatment',
        },
      });
    });
    
    it('should get only requested flags', async () => {
      const results = await featureFlagService.getFlags(['dark-mode', 'non-existent'], testUser);
      
      expect(results).toEqual({
        'dark-mode': true,
        'non-existent': false,
      });
    });
  });
  
  describe('sticky bucketing', () => {
    it('should consistently assign the same variant to the same user', async () => {
      const flag = {
        'sticky-experiment': {
          description: 'Sticky bucketing test',
          defaultValue: 'control',
          rules: [
            {
              condition: {},
              value: 'treatment',
              variant: 'treatment',
              weight: 0.5, // 50% of users
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      // Test with consistent user ID
      const user = { id: 'consistent-user' };
      
      // First evaluation
      const result1 = await featureFlagService.getVariant('sticky-experiment', user);
      
      // Second evaluation with same user
      const result2 = await featureFlagService.getVariant('sticky-experiment', user);
      
      // Should be the same result
      expect(result1).toEqual(result2);
    });
  });
  
  describe('percentage rollouts', () => {
    it('should respect percentage rollouts', async () => {
      const flag = {
        'percentage-rollout': {
          description: 'Percentage rollout test',
          defaultValue: 'control',
          rules: [
            {
              condition: {},
              value: 'treatment',
              variant: 'treatment',
              weight: 0.3, // 30% of users
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      // Test with enough users to see the distribution
      const results = await Promise.all(
        Array(1000).fill(0).map((_, i) =>
          featureFlagService.getVariant('percentage-rollout', { id: `user-${i}` })
        )
      );
      
      const treatmentCount = results.filter(r => r?.variant === 'treatment').length;
      const controlCount = results.filter(r => r?.variant === 'control').length;
      
      // Should be roughly 30% in treatment (with some tolerance)
      expect(treatmentCount).toBeGreaterThan(250); // >25%
      expect(treatmentCount).toBeLessThan(350);    // <35%
      expect(controlCount).toBeGreaterThan(650);    // >65%
      expect(controlCount).toBeLessThan(750);       // <75%
    });
  });
  
  describe('error handling', () => {
    it('should handle invalid flag configurations', async () => {
      const invalidFlag = {
        'invalid-flag': {
          // Missing defaultValue
          rules: [
            {
              condition: { always: true },
              value: true,
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: invalidFlag,
        logger: mockLogger as any,
      });
      
      const result = await featureFlagService.isEnabled('invalid-flag', testUser);
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid flag configuration',
        expect.any(Error)
      );
    });
    
    it('should handle invalid conditions', async () => {
      const flag = {
        'invalid-condition': {
          description: 'Flag with invalid condition',
          defaultValue: false,
          rules: [
            {
              condition: {
                // Invalid operator
                email: { $invalidOp: 'test' },
              },
              value: true,
            },
          ],
        },
      };
      
      featureFlagService = new FeatureFlagService({
        flags: flag,
        logger: mockLogger as any,
      });
      
      const result = await featureFlagService.isEnabled('invalid-condition', {
        email: 'test@example.com',
      });
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error evaluating condition',
        expect.any(Error)
      );
    });
  });
});
