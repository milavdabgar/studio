export interface FeatureFlagUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  groups?: string[];
  attributes?: Record<string, unknown>;
  custom?: Record<string, unknown>;
}

export interface FeatureFlagCondition {
  [key: string]: unknown;
  $eq?: unknown;
  $ne?: unknown;
  $in?: unknown[];
  $nin?: unknown[];
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $exists?: boolean;
  $regex?: string;
  $endsWith?: string;
  $startsWith?: string;
  $contains?: string;
}

export interface FeatureFlagRule {
  condition?: Record<string, FeatureFlagCondition | unknown>;
  value?: unknown;
  variant?: string;
  percentage?: number;
  weight?: number; // Alternative to percentage (0-1 range)
  // Legacy support for old rule format  
  attribute?: string;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'gt' | 'lt';
  conditions?: Record<string, FeatureFlagCondition | unknown>;
}

export interface FeatureFlagConfig {
  description?: string;
  enabled?: boolean;
  defaultValue?: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  userIds?: string[];
  rules?: FeatureFlagRule[];
  variants?: Record<string, unknown>;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  config: FeatureFlagConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface Logger {
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
}

export interface FeatureFlagServiceConfig {
  storage?: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
  };
  flags?: Record<string, FeatureFlagConfig>;
  logger?: Logger;
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
  } | undefined;
  private logger: Logger;

  constructor(config?: FeatureFlagServiceConfig) {
    this.storage = config?.storage;
    this.logger = config?.logger || {
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console)
    };
    
    // Initialize with provided flags
    if (config?.flags) {
      this.initializeFlags(config.flags);
    }
  }

  private initializeFlags(flagConfigs: Record<string, FeatureFlagConfig>): void {
    for (const [key, config] of Object.entries(flagConfigs)) {
      const flag: FeatureFlag = {
        key,
        name: config.description || key,
        description: config.description,
        config,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.flags.set(key, flag);
    }
  }

  async initialize(): Promise<void> {
    await this.loadFlags();
  }

  private async loadFlags(): Promise<void> {
    if (this.storage) {
      try {
        const stored = await this.storage.getItem('featureFlags');
        if (stored) {
          const flagConfigs = JSON.parse(stored);
          this.flags.clear();
          // Initialize flags from stored configs
          this.initializeFlags(flagConfigs);
        }
      } catch (error) {
        this.logger.error('Failed to load feature flags from storage', error);
      }
    }
  }

  private async saveFlags(): Promise<void> {
    if (this.storage) {
      try {
        const flagConfigs: Record<string, FeatureFlagConfig> = {};
        for (const [key, flag] of this.flags.entries()) {
          flagConfigs[key] = flag.config;
        }
        await this.storage.setItem('featureFlags', JSON.stringify(flagConfigs));
      } catch (error) {
        this.logger.error('Failed to save feature flags', error);
        throw error;
      }
    }
  }

  getFlags(flagKeys?: string[]): Record<string, FeatureFlagConfig>;
  getFlags(flagKeys: string[], user: FeatureFlagUser): Promise<Record<string, unknown>>;
  getFlags(flagKeys?: string[] | FeatureFlagUser, user?: FeatureFlagUser): Record<string, FeatureFlagConfig> | Promise<Record<string, unknown>> {
    // If first parameter is a user object (no flagKeys array), it's getAllFlags with user
    if (flagKeys && !Array.isArray(flagKeys) && typeof flagKeys === 'object' && 'id' in flagKeys) {
      return this.getAllFlags(flagKeys as FeatureFlagUser);
    }
    
    // If user is provided, evaluate flags
    if (user) {
      return this.getMultipleFlags(flagKeys as string[], user);
    }
    
    // Return flag configurations (not full FeatureFlag objects)
    if (flagKeys) {
      const result: Record<string, FeatureFlagConfig> = {};
      for (const key of flagKeys as string[]) {
        const flag = this.flags.get(key);
        if (flag) {
          result[key] = flag.config;
        }
      }
      return result;
    }
    
    // Return all flag configurations
    const result: Record<string, FeatureFlagConfig> = {};
    for (const [key, flag] of this.flags.entries()) {
      result[key] = flag.config;
    }
    return result;
  }

  async getAllFlags(): Promise<FeatureFlag[]>;
  async getAllFlags(user: FeatureFlagUser): Promise<Record<string, unknown>>;
  async getAllFlags(user?: FeatureFlagUser): Promise<FeatureFlag[] | Record<string, unknown>> {
    if (user) {
      const flagKeys = Array.from(this.flags.keys());
      return this.getMultipleFlags(flagKeys, user);
    }
    return Array.from(this.flags.values());
  }

  async updateFlags(newFlags: Record<string, FeatureFlagConfig>): Promise<void> {
    for (const [key, config] of Object.entries(newFlags)) {
      const flag: FeatureFlag = {
        key,
        name: config.description || key,
        description: config.description,
        config,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.flags.set(key, flag);
    }
    await this.saveFlags();
  }

  async isEnabled(key: string, user?: FeatureFlagUser): Promise<boolean> {
    const flag = this.flags.get(key);
    
    if (!flag) {
      this.logger.warn(`Feature flag not found: ${key}`);
      return false;
    }

    try {
      if (flag.config.enabled === false) {
        return false;
      }

      // Validate flag configuration
      if (flag.config.defaultValue === undefined && (!flag.config.rules || flag.config.rules.length === 0)) {
        throw new Error('Flag must have either defaultValue or rules');
      }

      // Check user-specific overrides
      if (user && user.id && flag.config.userIds?.includes(user.id)) {
        return true;
      }

      // Check user group rules
      if (user && flag.config.userGroups && user.groups) {
        const hasGroup = flag.config.userGroups.some(group => 
          user.groups!.includes(group)
        );
        if (hasGroup) {
          return true;
        }
      }

      // Check custom rules
      if (user && flag.config.rules) {
        for (const rule of flag.config.rules) {
          let ruleMatches = false;
          
          // Check new condition format
          if (rule.condition) {
            ruleMatches = this.evaluateConditions(rule.condition, user);
          }
          // Check legacy conditions format
          else if (rule.conditions) {
            ruleMatches = this.evaluateConditions(rule.conditions, user);
          }
          // Check legacy rule format
          else if (rule.attribute && rule.operator) {
            ruleMatches = this.evaluateRule(rule, user);
          }
          
          if (ruleMatches) {
            // Check percentage/weight rollout for this rule
            const rolloutPercent = rule.percentage || (rule.weight ? rule.weight * 100 : undefined);
            
            if (rolloutPercent !== undefined) {
              if (user.id) {
                const hash = this.hashUser(user.id, key);
                const percentage = (hash % 100) + 1;
                if (percentage <= rolloutPercent) {
                  return rule.value !== undefined ? Boolean(rule.value) : true;
                }
              } else {
                // For users without ID, use random
                if (Math.random() * 100 < rolloutPercent) {
                  return rule.value !== undefined ? Boolean(rule.value) : true;
                }
              }
            } else {
              return rule.value !== undefined ? Boolean(rule.value) : true;
            }
          }
        }
        
        // If no rules matched, return default value
        if (flag.config.defaultValue !== undefined) {
          return Boolean(flag.config.defaultValue);
        } else {
          throw new Error('No matching rules and no default value specified');
        }
      }

      // Check global rollout percentage
      if (flag.config.rolloutPercentage !== undefined) {
        if (user && user.id) {
          const hash = this.hashUser(user.id, key);
          const percentage = (hash % 100) + 1;
          return percentage <= flag.config.rolloutPercentage;
        } else {
          return Math.random() * 100 < flag.config.rolloutPercentage;
        }
      }

      return flag.config.defaultValue !== undefined ? Boolean(flag.config.defaultValue) : true;
    } catch (error) {
      this.logger.error('Invalid flag configuration', error);
      return false;
    }
  }

  async getVariant(key: string, user?: FeatureFlagUser): Promise<unknown> {
    const flag = this.flags.get(key);
    
    if (!flag) {
      this.logger.warn(`Feature flag not found: ${key}`);
      return undefined;
    }

    try {
      // Check if flag has rules with variants
      if (user && flag.config.rules) {
        for (const rule of flag.config.rules) {
          let ruleMatches = false;
          
          // Check new condition format
          if (rule.condition) {
            ruleMatches = this.evaluateConditions(rule.condition, user);
          }
          // Check legacy conditions format
          else if (rule.conditions) {
            ruleMatches = this.evaluateConditions(rule.conditions, user);
          }
          // Check legacy rule format
          else if (rule.attribute && rule.operator) {
            ruleMatches = this.evaluateRule(rule, user);
          }
          
          if (ruleMatches) {
            // Check percentage/weight rollout for this rule
            const rolloutPercent = rule.percentage || (rule.weight ? rule.weight * 100 : undefined);
            
            if (rolloutPercent !== undefined && user && user.id) {
              const hash = this.hashUser(user.id, key);
              const percentage = (hash % 100) + 1;
              if (percentage <= rolloutPercent) {
                if (rule.variant && rule.value !== undefined) {
                  return {
                    value: rule.value,
                    variant: rule.variant
                  };
                } else if (rule.value !== undefined) {
                  return {
                    value: rule.value,
                    variant: 'treatment'
                  };
                }
              }
            } else if (rolloutPercent === undefined) {
              // No rollout percentage, rule matches
              if (rule.variant && rule.value !== undefined) {
                return {
                  value: rule.value,
                  variant: rule.variant
                };
              } else if (rule.value !== undefined) {
                return {
                  value: rule.value,
                  variant: 'treatment'
                };
              }
            }
          }
        }
      }
      
      // Return default variant if no rules matched
      if (flag.config.defaultValue !== undefined) {
        return {
          value: flag.config.defaultValue,
          variant: 'control'
        };
      }
      
      // Check if flag has defined variants (legacy support)
      if (flag.config.variants) {
        const enabled = await this.isEnabled(key, user);
        
        if (!enabled) {
          // Return default variant if exists
          if (flag.config.variants.control) {
            return {
              value: flag.config.variants.control,
              variant: 'control'
            };
          }
          return null;
        }

        // Default variant selection for legacy variants
        const variants = Object.keys(flag.config.variants);
        if (user && user.id) {
          const hash = this.hashUser(user.id, key);
          const variantIndex = hash % variants.length;
          const variantKey = variants[variantIndex];
          return {
            value: flag.config.variants[variantKey],
            variant: variantKey
          };
        }

        // Random variant selection
        const randomIndex = Math.floor(Math.random() * variants.length);
        const variantKey = variants[randomIndex];
        return {
          value: flag.config.variants[variantKey],
          variant: variantKey
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error evaluating variant', error);
      return null;
    }
  }

  async getMultipleFlags(flagKeys: string[], user?: FeatureFlagUser): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};
    
    for (const key of flagKeys) {
      const flag = this.flags.get(key);
      if (!flag) {
        // Return false for non-existent flags
        results[key] = false;
        continue;
      }
      
      // Check if flag has rules with variants
      if (flag.config.rules) {
        let hasVariants = false;
        for (const rule of flag.config.rules) {
          if (rule.variant && rule.value !== undefined) {
            hasVariants = true;
            break;
          }
        }
        
        if (hasVariants) {
          results[key] = await this.getVariant(key, user);
        } else {
          results[key] = await this.isEnabled(key, user);
        }
      } else {
        results[key] = await this.isEnabled(key, user);
      }
    }
    
    return results;
  }

  private evaluateConditions(conditions: Record<string, unknown>, user: FeatureFlagUser): boolean {
    try {
      // Empty conditions should match all users
      if (Object.keys(conditions).length === 0) {
        return true;
      }
      
      for (const [attribute, condition] of Object.entries(conditions)) {
        const userValue = this.getUserAttribute(user, attribute);
        
        if (typeof condition === 'object' && condition !== null) {
          // Complex condition with operators
          for (const [operator, value] of Object.entries(condition)) {
            if (!this.evaluateCondition(userValue, operator, value)) {
              return false;
            }
          }
        } else {
          // Simple equality check
          if (userValue !== condition) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      this.logger.error('Error evaluating condition', error);
      return false;
    }
  }

  private evaluateCondition(userValue: unknown, operator: string, value: unknown): boolean {
    switch (operator) {
      case '$eq':
        return userValue === value;
      case '$ne':
        return userValue !== value;
      case '$in':
        return Array.isArray(value) && value.includes(userValue);
      case '$nin':
        return Array.isArray(value) && !value.includes(userValue);
      case '$gt':
        return Number(userValue) > Number(value);
      case '$gte':
        return Number(userValue) >= Number(value);
      case '$lt':
        return Number(userValue) < Number(value);
      case '$lte':
        return Number(userValue) <= Number(value);
      case '$exists':
        return value ? userValue !== undefined : userValue === undefined;
      case '$regex':
        return new RegExp(String(value)).test(String(userValue));
      case '$endsWith':
        return String(userValue).endsWith(String(value));
      case '$startsWith':
        return String(userValue).startsWith(String(value));
      case '$contains':
        return String(userValue).includes(String(value));
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  async createFlag(
    key: string,
    name: string,
    config: FeatureFlagConfig,
    description?: string
  ): Promise<FeatureFlag> {
    const flag: FeatureFlag = {
      key,
      name,
      description,
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.flags.set(key, flag);
    await this.saveFlags();

    return flag;
  }

  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    const flag = this.flags.get(key);
    
    if (!flag) {
      return null;
    }

    const updatedFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date(),
    };

    this.flags.set(key, updatedFlag);
    await this.saveFlags();

    return updatedFlag;
  }

  async deleteFlag(key: string): Promise<boolean> {
    const deleted = this.flags.delete(key);
    
    if (deleted) {
      await this.saveFlags();
    }

    return deleted;
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    return this.flags.get(key) || null;
  }

  private evaluateRule(rule: FeatureFlagRule, user: FeatureFlagUser): boolean {
    if (!rule.attribute || !rule.operator) return false;
    
    const userValue = this.getUserAttribute(user, rule.attribute);
    
    switch (rule.operator) {
      case 'equals':
        return userValue === rule.value;
      case 'contains':
        return String(userValue).includes(String(rule.value));
      case 'startsWith':
        return String(userValue).startsWith(String(rule.value));
      case 'endsWith':
        return String(userValue).endsWith(String(rule.value));
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(userValue);
      case 'gt':
        return Number(userValue) > Number(rule.value);
      case 'lt':
        return Number(userValue) < Number(rule.value);
      default:
        return false;
    }
  }

  private getUserAttribute(user: FeatureFlagUser, attribute: string): unknown {
    // Handle dot notation for nested attributes
    if (attribute.includes('.')) {
      const parts = attribute.split('.');
      let value: unknown = user;
      
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
      
      return value;
    }
    
    // Handle direct attributes
    switch (attribute) {
      case 'id':
        return user.id;
      case 'email':
        return user.email;
      case 'name':
        return user.name;
      case 'role':
        return user.role;
      case 'groups':
        return user.groups;
      default:
        // Check custom attributes first, then fallback to attributes
        return user.custom?.[attribute] ?? user.attributes?.[attribute];
    }
  }

  private hashUser(userId: string, flagKey: string): number {
    const str = `${userId}:${flagKey}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  async refresh(): Promise<void> {
    await this.loadFlags();
  }
}
