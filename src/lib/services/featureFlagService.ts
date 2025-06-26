export interface FeatureFlagUser {
  id: string;
  email?: string;
  role?: string;
  groups?: string[];
  attributes?: Record<string, any>;
}

export interface FeatureFlagCondition {
  [key: string]: any;
  $eq?: any;
  $ne?: any;
  $in?: any[];
  $nin?: any[];
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $exists?: boolean;
  $regex?: string;
}

export interface FeatureFlagRule {
  attribute?: string;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'gt' | 'lt';
  value?: any;
  conditions?: Record<string, FeatureFlagCondition | any>;
  percentage?: number;
}

export interface FeatureFlagConfig {
  enabled: boolean;
  defaultValue?: any;
  rolloutPercentage?: number;
  userGroups?: string[];
  userIds?: string[];
  rules?: FeatureFlagRule[];
  variants?: Record<string, any>;
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
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private storage: any;
  private logger: Logger;

  constructor(storage?: any, logger?: Logger) {
    this.storage = storage;
    this.logger = logger || {
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console)
    };
  }

  async initialize(): Promise<void> {
    await this.loadFlags();
  }

  private async loadFlags(): Promise<void> {
    if (this.storage && typeof this.storage.getItem === 'function') {
      try {
        const stored = await this.storage.getItem('featureFlags');
        if (stored) {
          const flags = JSON.parse(stored);
          this.flags.clear();
          for (const [key, flag] of Object.entries(flags)) {
            this.flags.set(key, flag as FeatureFlag);
          }
        }
      } catch (error) {
        this.logger.error('Failed to load feature flags from storage:', error);
      }
    }
  }

  private async saveFlags(): Promise<void> {
    if (this.storage && typeof this.storage.setItem === 'function') {
      try {
        const flags = Object.fromEntries(this.flags.entries());
        await this.storage.setItem('featureFlags', JSON.stringify(flags));
      } catch (error) {
        this.logger.error('Failed to save feature flags to storage:', error);
        throw error;
      }
    }
  }

  getFlags(flagKeys?: string[]): Record<string, FeatureFlag> {
    if (flagKeys) {
      const result: Record<string, FeatureFlag> = {};
      for (const key of flagKeys) {
        const flag = this.flags.get(key);
        if (flag) {
          result[key] = flag;
        }
      }
      return result;
    }
    return Object.fromEntries(this.flags.entries());
  }

  async updateFlags(newFlags: Record<string, FeatureFlag>): Promise<void> {
    for (const [key, flag] of Object.entries(newFlags)) {
      this.flags.set(key, {
        ...flag,
        updatedAt: new Date()
      });
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
      if (!flag.config.enabled) {
        return false;
      }

      // Check user-specific overrides
      if (user && flag.config.userIds?.includes(user.id)) {
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
          if (rule.conditions) {
            const conditionsMatch = this.evaluateConditions(rule.conditions, user);
            if (!conditionsMatch) {
              continue;
            }
          } else if (rule.attribute && rule.operator) {
            const ruleMatch = this.evaluateRule(rule, user);
            if (!ruleMatch) {
              continue;
            }
          }
          
          // Check percentage rollout for this rule
          if (rule.percentage !== undefined) {
            const hash = this.hashUser(user.id, key);
            const percentage = (hash % 100) + 1;
            if (percentage <= rule.percentage) {
              return true;
            }
          } else {
            return true;
          }
        }
        return false;
      }

      // Check global rollout percentage
      if (flag.config.rolloutPercentage !== undefined) {
        if (user) {
          const hash = this.hashUser(user.id, key);
          const percentage = (hash % 100) + 1;
          return percentage <= flag.config.rolloutPercentage;
        } else {
          return Math.random() * 100 < flag.config.rolloutPercentage;
        }
      }

      return flag.config.defaultValue !== undefined ? flag.config.defaultValue : true;
    } catch (error) {
      this.logger.error('Invalid flag configuration', error);
      return false;
    }
  }

  async getVariant(key: string, user?: FeatureFlagUser): Promise<any> {
    const flag = this.flags.get(key);
    
    if (!flag) {
      this.logger.warn(`Feature flag not found: ${key}`);
      return undefined;
    }

    try {
      const enabled = await this.isEnabled(key, user);
      
      if (!enabled) {
        // Return default variant if exists
        if (flag.config.variants && flag.config.variants.control) {
          return {
            value: flag.config.variants.control,
            variant: 'control'
          };
        }
        return null;
      }

      if (!flag.config.variants) {
        return null;
      }

      // Check for specific rule variants
      if (user && flag.config.rules) {
        for (const rule of flag.config.rules) {
          let ruleMatches = false;
          
          if (rule.conditions) {
            ruleMatches = this.evaluateConditions(rule.conditions, user);
          } else if (rule.attribute && rule.operator) {
            ruleMatches = this.evaluateRule(rule, user);
          }
          
          if (ruleMatches) {
            // Use deterministic variant selection for this rule
            const variants = Object.keys(flag.config.variants);
            const hash = this.hashUser(user.id, key);
            const variantIndex = hash % variants.length;
            const variantKey = variants[variantIndex];
            return {
              value: flag.config.variants[variantKey],
              variant: variantKey
            };
          }
        }
      }

      // Default variant selection
      const variants = Object.keys(flag.config.variants);
      if (user) {
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
    } catch (error) {
      this.logger.error('Error evaluating variant', error);
      return null;
    }
  }

  async getMultipleFlags(flagKeys: string[], user?: FeatureFlagUser): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const key of flagKeys) {
      const flag = this.flags.get(key);
      if (!flag) continue;
      
      if (flag.config.variants) {
        results[key] = await this.getVariant(key, user);
      } else {
        results[key] = await this.isEnabled(key, user);
      }
    }
    
    return results;
  }

  private evaluateConditions(conditions: Record<string, any>, user: FeatureFlagUser): boolean {
    try {
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

  private evaluateCondition(userValue: any, operator: string, value: any): boolean {
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
        return new RegExp(value).test(String(userValue));
      default:
        return false;
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

  async getAllFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
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

  private getUserAttribute(user: FeatureFlagUser, attribute: string): any {
    switch (attribute) {
      case 'id':
        return user.id;
      case 'email':
        return user.email;
      case 'role':
        return user.role;
      case 'groups':
        return user.groups;
      default:
        return user.attributes?.[attribute];
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
