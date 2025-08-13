import { FeatureFlagService, FeatureFlagConfig, FeatureFlagUser, Logger } from '../featureFlagService';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let mockStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
  };
  let mockLogger: Logger;

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    };
    
    mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn()
    };

    service = new FeatureFlagService({
      storage: mockStorage,
      logger: mockLogger
    });
  });

  describe('constructor', () => {
    it('should initialize with default logger if none provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const serviceWithoutLogger = new FeatureFlagService();
      
      // Access private logger through a test method or indirect call
      serviceWithoutLogger['logger'].warn('test');
      expect(consoleSpy).toHaveBeenCalledWith('test');
      
      consoleSpy.mockRestore();
    });

    it('should initialize with provided flags', () => {
      const flags = {
        testFlag: { defaultValue: true, description: 'Test flag' }
      };
      
      const serviceWithFlags = new FeatureFlagService({ flags });
      const flagConfigs = serviceWithFlags.getFlags();
      
      expect(flagConfigs.testFlag).toEqual(flags.testFlag);
    });
  });

  describe('initialize', () => {
    it('should load flags from storage', async () => {
      const storedFlags = {
        storedFlag: { defaultValue: false, description: 'Stored flag' }
      };
      mockStorage.getItem.mockResolvedValue(JSON.stringify(storedFlags));

      await service.initialize();

      expect(mockStorage.getItem).toHaveBeenCalledWith('featureFlags');
      const flags = service.getFlags();
      expect(flags.storedFlag).toEqual(storedFlags.storedFlag);
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await service.initialize();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load feature flags from storage',
        expect.any(Error)
      );
    });

    it('should handle invalid JSON in storage', async () => {
      mockStorage.getItem.mockResolvedValue('invalid-json');

      await service.initialize();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getFlags', () => {
    beforeEach(async () => {
      await service.updateFlags({
        flag1: { defaultValue: true },
        flag2: { defaultValue: false },
        flag3: { defaultValue: true, description: 'Flag 3' }
      });
    });

    it('should return all flags when no parameters provided', () => {
      const flags = service.getFlags();
      expect(Object.keys(flags)).toHaveLength(3);
      expect(flags.flag1.defaultValue).toBe(true);
      expect(flags.flag2.defaultValue).toBe(false);
    });

    it('should return specific flags when flagKeys provided', () => {
      const flags = service.getFlags(['flag1', 'flag3']);
      expect(Object.keys(flags)).toHaveLength(2);
      expect(flags.flag1.defaultValue).toBe(true);
      expect(flags.flag3.defaultValue).toBe(true);
      expect(flags.flag2).toBeUndefined();
    });

    it('should handle non-existent flag keys', () => {
      const flags = service.getFlags(['flag1', 'nonExistent']);
      expect(Object.keys(flags)).toHaveLength(1);
      expect(flags.flag1.defaultValue).toBe(true);
      expect(flags.nonExistent).toBeUndefined();
    });

    it('should evaluate flags with user when user provided', async () => {
      const user = { id: 'user1', role: 'admin' };
      const result = await service.getFlags(['flag1'], user);
      expect(typeof result).toBe('object');
      expect(result.flag1).toBeDefined();
    });

    it('should treat first parameter as user when it is an object with id', async () => {
      const user = { id: 'user1', role: 'admin' };
      const result = await service.getFlags(user as any);
      expect(typeof result).toBe('object');
    });
  });

  describe('isEnabled', () => {
    it('should return false for non-existent flags', async () => {
      const result = await service.isEnabled('nonExistent');
      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Feature flag not found: nonExistent');
    });

    it('should return false when flag is explicitly disabled', async () => {
      await service.updateFlags({
        disabledFlag: { enabled: false, defaultValue: true }
      });

      const result = await service.isEnabled('disabledFlag');
      expect(result).toBe(false);
    });

    it('should return default value when no user provided', async () => {
      await service.updateFlags({
        defaultTrue: { defaultValue: true },
        defaultFalse: { defaultValue: false }
      });

      expect(await service.isEnabled('defaultTrue')).toBe(true);
      expect(await service.isEnabled('defaultFalse')).toBe(false);
    });

    it('should handle rollout percentage without user', async () => {
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.3); // 30%

      await service.updateFlags({
        rolloutFlag: { rolloutPercentage: 50, defaultValue: false }
      });

      const result = await service.isEnabled('rolloutFlag');
      expect(result).toBe(true); // 0.3 * 100 = 30, and 30 < 50 is true

      Math.random = originalRandom;
    });

    it('should handle rollout percentage with user ID', async () => {
      await service.updateFlags({
        rolloutFlag: { rolloutPercentage: 50 }
      });

      const user = { id: 'user1' };
      const result = await service.isEnabled('rolloutFlag', user);
      expect(typeof result).toBe('boolean');
    });

    it('should return true for users in userIds list', async () => {
      await service.updateFlags({
        userSpecific: { defaultValue: false, userIds: ['user1', 'user2'] }
      });

      const user1 = { id: 'user1' };
      const user3 = { id: 'user3' };

      expect(await service.isEnabled('userSpecific', user1)).toBe(true);
      expect(await service.isEnabled('userSpecific', user3)).toBe(false);
    });

    it('should return true for users in userGroups', async () => {
      await service.updateFlags({
        groupSpecific: { defaultValue: false, userGroups: ['admin', 'beta'] }
      });

      const adminUser = { id: 'user1', groups: ['admin', 'regular'] };
      const regularUser = { id: 'user2', groups: ['regular'] };

      expect(await service.isEnabled('groupSpecific', adminUser)).toBe(true);
      expect(await service.isEnabled('groupSpecific', regularUser)).toBe(false);
    });

    it('should evaluate rules with new condition format', async () => {
      await service.updateFlags({
        ruleFlag: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'admin' } },
            value: true
          }]
        }
      });

      const adminUser = { id: 'user1', role: 'admin' };
      const regularUser = { id: 'user2', role: 'user' };

      expect(await service.isEnabled('ruleFlag', adminUser)).toBe(true);
      expect(await service.isEnabled('ruleFlag', regularUser)).toBe(false);
    });

    it('should evaluate rules with legacy conditions format', async () => {
      await service.updateFlags({
        legacyRule: {
          defaultValue: false,
          rules: [{
            conditions: { role: 'admin' },
            value: true
          }]
        }
      });

      const adminUser = { id: 'user1', role: 'admin' };
      expect(await service.isEnabled('legacyRule', adminUser)).toBe(true);
    });

    it('should evaluate legacy rule format', async () => {
      await service.updateFlags({
        oldFormatRule: {
          defaultValue: false,
          rules: [{
            attribute: 'role',
            operator: 'equals',
            value: 'admin'
          }]
        }
      });

      const adminUser = { id: 'user1', role: 'admin' };
      expect(await service.isEnabled('oldFormatRule', adminUser)).toBe(true);
    });

    it('should handle rule percentage rollout', async () => {
      await service.updateFlags({
        percentageRule: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'user' } },
            percentage: 50,
            value: true
          }]
        }
      });

      const user = { id: 'consistent-user', role: 'user' };
      const result = await service.isEnabled('percentageRule', user);
      expect(typeof result).toBe('boolean');
    });

    it('should handle rule weight rollout', async () => {
      await service.updateFlags({
        weightRule: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'user' } },
            weight: 0.75,
            value: true
          }]
        }
      });

      const user = { id: 'test-user', role: 'user' };
      const result = await service.isEnabled('weightRule', user);
      expect(typeof result).toBe('boolean');
    });

    it('should throw error for invalid flag configuration', async () => {
      await service.updateFlags({
        invalidFlag: {} // No defaultValue or rules
      });

      const result = await service.isEnabled('invalidFlag');
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid flag configuration',
        expect.any(Error)
      );
    });

    it('should handle users without ID for percentage rollout', async () => {
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.3);

      await service.updateFlags({
        anonymousRule: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'guest' } },
            percentage: 50,
            value: true
          }]
        }
      });

      const anonymousUser = { role: 'guest' }; // No ID
      const result = await service.isEnabled('anonymousRule', anonymousUser);
      expect(result).toBe(true);

      Math.random = originalRandom;
    });
  });

  describe('getVariant', () => {
    it('should return undefined for non-existent flags', async () => {
      const result = await service.getVariant('nonExistent');
      expect(result).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith('Feature flag not found: nonExistent');
    });

    it('should return variant from matching rule', async () => {
      await service.updateFlags({
        variantFlag: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'admin' } },
            value: 'admin-experience',
            variant: 'admin'
          }]
        }
      });

      const adminUser = { id: 'user1', role: 'admin' };
      const result = await service.getVariant('variantFlag', adminUser);
      
      expect(result).toEqual({
        value: 'admin-experience',
        variant: 'admin'
      });
    });

    it('should return treatment variant when rule matches but no variant specified', async () => {
      await service.updateFlags({
        treatmentFlag: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'user' } },
            value: true
          }]
        }
      });

      const user = { id: 'user1', role: 'user' };
      const result = await service.getVariant('treatmentFlag', user);
      
      expect(result).toEqual({
        value: true,
        variant: 'treatment'
      });
    });

    it('should return control variant for default value', async () => {
      await service.updateFlags({
        defaultFlag: { defaultValue: 'default-value' as any }
      });

      const result = await service.getVariant('defaultFlag');
      expect(result).toEqual({
        value: 'default-value',
        variant: 'control'
      });
    });

    it('should handle legacy variants', async () => {
      await service.updateFlags({
        legacyVariants: {
          defaultValue: true,
          variants: {
            control: 'control-value',
            treatment: 'treatment-value'
          }
        }
      });

      const user = { id: 'consistent-user' };
      const result = await service.getVariant('legacyVariants', user);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('variant');
    });

    it('should return control variant for disabled legacy variants', async () => {
      await service.updateFlags({
        disabledVariants: {
          enabled: false,
          variants: {
            control: 'control-value',
            treatment: 'treatment-value'
          }
        }
      });

      const user = { id: 'user1' };
      const result = await service.getVariant('disabledVariants', user);
      expect(result).toEqual({
        value: 'control-value',
        variant: 'control'
      });
    });

    it('should handle percentage rollout in variants', async () => {
      await service.updateFlags({
        rolloutVariant: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'user' } },
            percentage: 100, // Always match
            value: 'variant-value',
            variant: 'test'
          }]
        }
      });

      const user = { id: 'user1', role: 'user' };
      const result = await service.getVariant('rolloutVariant', user);
      expect(result).toEqual({
        value: 'variant-value',
        variant: 'test'
      });
    });

    it('should handle errors gracefully', async () => {
      // Create a flag that will cause an error during evaluation
      await service.updateFlags({
        errorFlag: {
          defaultValue: false,
          rules: [{
            condition: { role: { $unknown: 'admin' } }, // Unknown operator
            value: true
          }]
        }
      });

      const result = await service.getVariant('errorFlag', { id: 'user1', role: 'admin' });
      expect(result).toEqual({ value: false, variant: 'control' }); // Falls back to default
    });
  });

  describe('condition evaluation', () => {
    beforeEach(async () => {
      await service.updateFlags({
        conditionFlag: {
          defaultValue: false,
          rules: [{
            condition: {},
            value: true
          }]
        }
      });
    });

    it('should evaluate $eq condition', async () => {
      await service.updateFlags({
        eqFlag: {
          defaultValue: false,
          rules: [{ condition: { role: { $eq: 'admin' } }, value: true }]
        }
      });

      expect(await service.isEnabled('eqFlag', { id: 'u1', role: 'admin' })).toBe(true);
      expect(await service.isEnabled('eqFlag', { id: 'u1', role: 'user' })).toBe(false);
    });

    it('should evaluate $ne condition', async () => {
      await service.updateFlags({
        neFlag: {
          defaultValue: false,
          rules: [{ condition: { role: { $ne: 'guest' } }, value: true }]
        }
      });

      expect(await service.isEnabled('neFlag', { id: 'u1', role: 'admin' })).toBe(true);
      expect(await service.isEnabled('neFlag', { id: 'u1', role: 'guest' })).toBe(false);
    });

    it('should evaluate $in condition', async () => {
      await service.updateFlags({
        inFlag: {
          defaultValue: false,
          rules: [{ condition: { role: { $in: ['admin', 'moderator'] } }, value: true }]
        }
      });

      expect(await service.isEnabled('inFlag', { id: 'u1', role: 'admin' })).toBe(true);
      expect(await service.isEnabled('inFlag', { id: 'u1', role: 'user' })).toBe(false);
    });

    it('should evaluate $nin condition', async () => {
      await service.updateFlags({
        ninFlag: {
          defaultValue: false,
          rules: [{ condition: { role: { $nin: ['guest', 'banned'] } }, value: true }]
        }
      });

      expect(await service.isEnabled('ninFlag', { id: 'u1', role: 'admin' })).toBe(true);
      expect(await service.isEnabled('ninFlag', { id: 'u1', role: 'guest' })).toBe(false);
    });

    it('should evaluate numeric conditions', async () => {
      const user = { id: 'u1', custom: { age: 25 } };
      
      await service.updateFlags({
        gtFlag: { defaultValue: false, rules: [{ condition: { 'custom.age': { $gt: 20 } }, value: true }] },
        gteFlag: { defaultValue: false, rules: [{ condition: { 'custom.age': { $gte: 25 } }, value: true }] },
        ltFlag: { defaultValue: false, rules: [{ condition: { 'custom.age': { $lt: 30 } }, value: true }] },
        lteFlag: { defaultValue: false, rules: [{ condition: { 'custom.age': { $lte: 25 } }, value: true }] }
      });

      expect(await service.isEnabled('gtFlag', user)).toBe(true);
      expect(await service.isEnabled('gteFlag', user)).toBe(true);
      expect(await service.isEnabled('ltFlag', user)).toBe(true);
      expect(await service.isEnabled('lteFlag', user)).toBe(true);
    });

    it('should evaluate $exists condition', async () => {
      await service.updateFlags({
        existsTrue: { defaultValue: false, rules: [{ condition: { email: { $exists: true } }, value: true }] },
        existsFalse: { defaultValue: false, rules: [{ condition: { phone: { $exists: false } }, value: true }] }
      });

      const user = { id: 'u1', email: 'user@example.com' };
      expect(await service.isEnabled('existsTrue', user)).toBe(true);
      expect(await service.isEnabled('existsFalse', user)).toBe(true);
    });

    it('should evaluate string conditions', async () => {
      const user = { id: 'u1', email: 'user@example.com', name: 'John Doe' };
      
      await service.updateFlags({
        regexFlag: { defaultValue: false, rules: [{ condition: { email: { $regex: '.*@example\\.com$' } }, value: true }] },
        startsFlag: { defaultValue: false, rules: [{ condition: { name: { $startsWith: 'John' } }, value: true }] },
        endsFlag: { defaultValue: false, rules: [{ condition: { name: { $endsWith: 'Doe' } }, value: true }] },
        containsFlag: { defaultValue: false, rules: [{ condition: { name: { $contains: 'oh' } }, value: true }] }
      });

      expect(await service.isEnabled('regexFlag', user)).toBe(true);
      expect(await service.isEnabled('startsFlag', user)).toBe(true);
      expect(await service.isEnabled('endsFlag', user)).toBe(true);
      expect(await service.isEnabled('containsFlag', user)).toBe(true);
    });

    it('should handle nested user attributes', async () => {
      const user = {
        id: 'u1',
        custom: {
          profile: {
            level: 'premium'
          }
        }
      };

      await service.updateFlags({
        nestedFlag: {
          defaultValue: false,
          rules: [{ condition: { 'custom.profile.level': { $eq: 'premium' } }, value: true }]
        }
      });

      expect(await service.isEnabled('nestedFlag', user)).toBe(true);
    });

    it('should handle unknown operators', async () => {
      await service.updateFlags({
        unknownOpFlag: {
          defaultValue: false,
          rules: [{ condition: { role: { $unknown: 'admin' } }, value: true }]
        }
      });

      const result = await service.isEnabled('unknownOpFlag', { id: 'u1', role: 'admin' });
      expect(result).toBe(false);
    });
  });

  describe('legacy rule evaluation', () => {
    it('should evaluate legacy operators', async () => {
      const user = { id: 'u1', role: 'admin', email: 'admin@example.com', custom: { level: 5 } };

      await service.updateFlags({
        equalsRule: { defaultValue: false, rules: [{ attribute: 'role', operator: 'equals', value: 'admin' }] },
        containsRule: { defaultValue: false, rules: [{ attribute: 'email', operator: 'contains', value: 'admin' }] },
        startsRule: { defaultValue: false, rules: [{ attribute: 'email', operator: 'startsWith', value: 'admin' }] },
        endsRule: { defaultValue: false, rules: [{ attribute: 'email', operator: 'endsWith', value: '.com' }] },
        inRule: { defaultValue: false, rules: [{ attribute: 'role', operator: 'in', value: ['admin', 'mod'] }] },
        gtRule: { defaultValue: false, rules: [{ attribute: 'custom.level', operator: 'gt', value: 3 }] },
        ltRule: { defaultValue: false, rules: [{ attribute: 'custom.level', operator: 'lt', value: 10 }] }
      });

      expect(await service.isEnabled('equalsRule', user)).toBe(true);
      expect(await service.isEnabled('containsRule', user)).toBe(true);
      expect(await service.isEnabled('startsRule', user)).toBe(true);
      expect(await service.isEnabled('endsRule', user)).toBe(true);
      expect(await service.isEnabled('inRule', user)).toBe(true);
      expect(await service.isEnabled('gtRule', user)).toBe(true);
      expect(await service.isEnabled('ltRule', user)).toBe(true);
    });
  });

  describe('CRUD operations', () => {
    it('should create a new flag', async () => {
      const config: FeatureFlagConfig = { defaultValue: true, description: 'New flag' };
      const flag = await service.createFlag('newFlag', 'New Flag', config, 'A new flag');

      expect(flag.key).toBe('newFlag');
      expect(flag.name).toBe('New Flag');
      expect(flag.description).toBe('A new flag');
      expect(flag.config).toEqual(config);
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it('should update an existing flag', async () => {
      await service.createFlag('updateFlag', 'Update Flag', { defaultValue: false });
      
      const updated = await service.updateFlag('updateFlag', {
        name: 'Updated Flag',
        config: { defaultValue: true }
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Flag');
      expect(updated!.config.defaultValue).toBe(true);
    });

    it('should return null when updating non-existent flag', async () => {
      const result = await service.updateFlag('nonExistent', { name: 'New Name' });
      expect(result).toBeNull();
    });

    it('should delete a flag', async () => {
      await service.createFlag('deleteFlag', 'Delete Flag', { defaultValue: true });
      
      const deleted = await service.deleteFlag('deleteFlag');
      expect(deleted).toBe(true);

      const flag = await service.getFlag('deleteFlag');
      expect(flag).toBeNull();
    });

    it('should return false when deleting non-existent flag', async () => {
      const result = await service.deleteFlag('nonExistent');
      expect(result).toBe(false);
    });

    it('should get a specific flag', async () => {
      const config = { defaultValue: true, description: 'Get flag test' };
      await service.createFlag('getFlag', 'Get Flag', config);
      
      const flag = await service.getFlag('getFlag');
      expect(flag).not.toBeNull();
      expect(flag!.key).toBe('getFlag');
      expect(flag!.config).toEqual(config);
    });
  });

  describe('refresh', () => {
    it('should reload flags from storage', async () => {
      mockStorage.getItem.mockResolvedValue(JSON.stringify({
        refreshedFlag: { defaultValue: true }
      }));

      await service.refresh();
      
      const flags = service.getFlags();
      expect(flags.refreshedFlag).toBeDefined();
    });
  });

  describe('getAllFlags', () => {
    beforeEach(async () => {
      await service.updateFlags({
        flag1: { defaultValue: true },
        flag2: { defaultValue: false }
      });
    });

    it('should return all flag objects when no user provided', async () => {
      const flags = await service.getAllFlags();
      expect(Array.isArray(flags)).toBe(true);
      expect(flags).toHaveLength(2);
      expect(flags[0]).toHaveProperty('key');
      expect(flags[0]).toHaveProperty('config');
    });

    it('should return evaluated flags when user provided', async () => {
      const user = { id: 'user1', role: 'admin' };
      const result = await service.getAllFlags(user);
      expect(typeof result).toBe('object');
      expect(Array.isArray(result)).toBe(false);
      expect(result.flag1).toBeDefined();
      expect(result.flag2).toBeDefined();
    });
  });

  describe('getMultipleFlags', () => {
    beforeEach(async () => {
      await service.updateFlags({
        simpleFlag: { defaultValue: true },
        variantFlag: {
          defaultValue: false,
          rules: [{
            condition: { role: { $eq: 'admin' } },
            value: 'admin-value',
            variant: 'admin'
          }]
        },
        nonExistentTest: { defaultValue: true }
      });
    });

    it('should return evaluated flags for existing keys', async () => {
      const user = { id: 'user1', role: 'admin' };
      const result = await service.getMultipleFlags(['simpleFlag', 'variantFlag'], user);
      
      expect(result.simpleFlag).toBe(true);
      expect(result.variantFlag).toEqual({
        value: 'admin-value',
        variant: 'admin'
      });
    });

    it('should return false for non-existent flags', async () => {
      const result = await service.getMultipleFlags(['simpleFlag', 'nonExistent']);
      expect(result.simpleFlag).toBe(true);
      expect(result.nonExistent).toBe(false);
    });

    it('should handle flags without variants', async () => {
      const user = { id: 'user1', role: 'user' };
      const result = await service.getMultipleFlags(['simpleFlag'], user);
      expect(result.simpleFlag).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle storage save errors', async () => {
      mockStorage.setItem.mockRejectedValue(new Error('Storage full'));
      
      await expect(service.updateFlags({ testFlag: { defaultValue: true } }))
        .rejects.toThrow('Storage full');
    });

    it('should handle empty conditions as matching all users', async () => {
      await service.updateFlags({
        emptyConditions: {
          defaultValue: false,
          rules: [{ condition: {}, value: true }]
        }
      });

      const result = await service.isEnabled('emptyConditions', { id: 'user1' });
      expect(result).toBe(true);
    });

    it('should handle user attributes that do not exist', async () => {
      const user = { id: 'user1' }; // No role attribute
      
      await service.updateFlags({
        missingAttrFlag: {
          defaultValue: false,
          rules: [{ condition: { role: { $eq: 'admin' } }, value: true }]
        }
      });

      const result = await service.isEnabled('missingAttrFlag', user);
      expect(result).toBe(false);
    });

    it('should handle malformed user objects', async () => {
      const malformedUser = null as any;
      
      await service.updateFlags({
        testFlag: { defaultValue: true }
      });

      const result = await service.isEnabled('testFlag', malformedUser);
      expect(result).toBe(true); // Should fall back to default
    });
  });
});