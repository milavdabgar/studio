export interface NormalizedResponse {
  entities: Record<string, Record<string | number, unknown>>;
  result: (string | number)[];
  meta?: Record<string, unknown>;
}

export interface NormalizationOptions {
  [key: string]: string | undefined;
  entityType?: string;
}

export class DataTransformService {
  static normalizeResponse(response: { data?: any; meta?: any }, options?: NormalizationOptions): NormalizedResponse { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!response || !response.data) {
      return {
        entities: {},
        result: [],
        meta: response?.meta,
      };
    }

    const entities: Record<string, Record<string | number, unknown>> = {};
    const result: (string | number)[] = [];
    const data = Array.isArray(response.data) ? response.data : [response.data];

    // Determine entity type from the first item or default to 'items'
    const entityType = options?.entityType || 'items';
    entities[entityType] = {};

    data.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (item && typeof item === 'object' && 'id' in item) {
        const normalizedItem = { ...item };
        
        // Handle nested objects based on options
        if (options) {
          Object.entries(options).forEach(([key, entityName]) => {
            if (key !== 'entityType' && entityName && normalizedItem[key]) {
              if (Array.isArray(normalizedItem[key])) {
                // Handle arrays of nested objects
                if (!entities[entityName]) entities[entityName] = {};
                normalizedItem[key] = normalizedItem[key].map((nestedItem: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                  if (nestedItem && typeof nestedItem === 'object' && 'id' in nestedItem) {
                    entities[entityName][nestedItem.id] = nestedItem;
                    return nestedItem.id;
                  }
                  return nestedItem;
                });
              } else if (typeof normalizedItem[key] === 'object' && normalizedItem[key].id) {
                // Handle single nested object
                if (!entities[entityName]) entities[entityName] = {};
                const nestedItem = normalizedItem[key];
                entities[entityName][nestedItem.id] = nestedItem;
                normalizedItem[key] = nestedItem.id;
              }
            }
          });
        }

        entities[entityType][item.id] = normalizedItem;
        result.push(item.id);
      }
    });

    const meta = response.meta ? { ...response.meta } : undefined;
    if (meta && typeof meta.total === 'number' && typeof meta.limit === 'number' && !meta.totalPages) {
      meta.totalPages = Math.ceil(meta.total / meta.limit);
    }

    return {
      entities,
      result,
      meta,
    };
  }

  static denormalize(normalizedData: { entities?: any; result?: any }, entityType: string, relations?: string[]): any[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!normalizedData.entities || !normalizedData.entities[entityType]) {
      return [];
    }

    const entities = normalizedData.entities;
    const entityIds = normalizedData.result || Object.keys(entities[entityType]);

    return entityIds.map((id: string | number) => {
      const entity = { ...entities[entityType][id] };
      
      // Resolve relations if specified
      if (relations) {
        relations.forEach(relation => {
          if (entity[relation] && typeof entity[relation] !== 'object') {
            // Find the relation in entities
            Object.keys(entities).forEach(entityName => {
              if (entities[entityName][entity[relation]]) {
                entity[relation] = entities[entityName][entity[relation]];
              }
            });
          } else if (Array.isArray(entity[relation])) {
            entity[relation] = entity[relation].map((relId: string | number) => {
              // Find the relation in entities
              let resolved = relId;
              Object.keys(entities).forEach(entityName => {
                if (entities[entityName][relId]) {
                  resolved = entities[entityName][relId];
                }
              });
              return resolved;
            });
          }
        });
      }

      return entity;
    });
  }

  static formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
      }
    } else {
      return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
    }
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      JPY: '¥',
    };

    const symbol = symbols[currency] || '$';
    
    if (currency === 'JPY') {
      return `${symbol}${amount}`;
    }
    
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Normalize accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim();
  }

  static parseQueryString(queryString: string): Record<string, unknown> {
    const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of params.entries()) {
      if (key.includes('[]')) {
        const arrayKey = key.replace('[]', '');
        if (!result[arrayKey]) {
          result[arrayKey] = [];
        }
        (result[arrayKey] as string[]).push(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  static stringifyQuery(params: Record<string, unknown>): string {
    if (Object.keys(params).length === 0) {
      return '';
    }
    
    const parts: string[] = [];
    
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach(v => parts.push(`${key}[]=${encodeURIComponent(v.toString())}`));
      } else if (value !== undefined && value !== null) {
        parts.push(`${key}=${encodeURIComponent(value.toString())}`);
      }
    }
    
    return parts.join('&');
  }

  // Legacy methods for backward compatibility
  static transformToApiFormat(data: any): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    return data;
  }

  static transformFromApiFormat(data: any): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    return data;
  }

  static sanitizeData(data: any): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    return data;
  }
}
