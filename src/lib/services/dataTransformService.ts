export interface NormalizedResponse {
  entities: Record<string, Record<string | number, any>>;
  result: (string | number)[];
  meta?: Record<string, any>;
}

export interface NormalizationOptions {
  [key: string]: string;
}

export class DataTransformService {
  static normalizeResponse(response: any, options?: NormalizationOptions): NormalizedResponse {
    // Simple implementation - just return the data as-is for now
    // This would need to be enhanced to handle the full normalization logic expected by tests
    return {
      entities: {},
      result: [],
      ...response,
    };
  }

  static denormalize(normalizedData: any, entityType: string, relations?: string[]): any {
    // Simple denormalization implementation
    return normalizedData;
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
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }

  static parseQueryString(queryString: string): Record<string, any> {
    const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
    const result: Record<string, any> = {};
    
    for (const [key, value] of params.entries()) {
      if (key.includes('[]')) {
        const arrayKey = key.replace('[]', '');
        if (!result[arrayKey]) {
          result[arrayKey] = [];
        }
        result[arrayKey].push(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  static stringifyQuery(params: Record<string, any>): string {
    if (Object.keys(params).length === 0) {
      return '';
    }
    
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(`${key}[]`, v.toString()));
      } else if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    }
    
    return searchParams.toString();
  }

  // Legacy methods for backward compatibility
  static transformToApiFormat(data: any): any {
    return data;
  }

  static transformFromApiFormat(data: any): any {
    return data;
  }

  static sanitizeData(data: any): any {
    return data;
  }
}
