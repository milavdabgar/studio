export interface FeatureFlagUser {
  id: string;
  email?: string;
  role?: string;
  groups?: string[];
  attributes?: Record<string, any>;
}

export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  userIds?: string[];
  rules?: FeatureFlagRule[];
  variants?: Record<string, any>;
}

export interface FeatureFlagRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'gt' | 'lt';
  value: any;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  config: FeatureFlagConfig;
  createdAt: Date;
  updatedAt: Date;
}

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private storage: any;

  constructor(storage?: any) {
    this.storage = storage;
    this.loadFlags();
  }

  private async loadFlags(): Promise<void> {
    if (this.storage && typeof this.storage.getItem === 'function') {
      try {
        const stored = await this.storage.getItem('feature_flags');
        if (stored) {
          const flags = JSON.parse(stored);
          for (const flag of flags) {
            this.flags.set(flag.key, flag);
          }
        }
      } catch (error) {
        console.error('Failed to load feature flags from storage:', error);
      }
    }
  }

  private async saveFlags(): Promise<void> {
    if (this.storage && typeof this.storage.setItem === 'function') {
      try {
        const flags = Array.from(this.flags.values());
        await this.storage.setItem('feature_flags', JSON.stringify(flags));
      } catch (error) {
        console.error('Failed to save feature flags to storage:', error);
      }
    }
  }

  async isEnabled(key: string, user?: FeatureFlagUser): Promise<boolean> {
    const flag = this.flags.get(key);
    
    if (!flag) {
      return false;
    }

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
      const rulesMatch = flag.config.rules.every(rule => 
        this.evaluateRule(rule, user)
      );
      if (!rulesMatch) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.config.rolloutPercentage !== undefined) {
      if (user) {
        const hash = this.hashUser(user.id, key);
        const percentage = (hash % 100) + 1;
        return percentage <= flag.config.rolloutPercentage;
      } else {
        return Math.random() * 100 < flag.config.rolloutPercentage;
      }
    }

    return true;
  }

  async getVariant(key: string, user?: FeatureFlagUser): Promise<any> {
    const enabled = await this.isEnabled(key, user);
    
    if (!enabled) {
      return null;
    }

    const flag = this.flags.get(key);
    
    if (!flag || !flag.config.variants) {
      return true;
    }

    // If user is provided, use deterministic variant selection
    if (user) {
      const variants = Object.keys(flag.config.variants);
      const hash = this.hashUser(user.id, key);
      const variantIndex = hash % variants.length;
      const variantKey = variants[variantIndex];
      return flag.config.variants[variantKey];
    }

    // Random variant selection
    const variants = Object.values(flag.config.variants);
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
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
