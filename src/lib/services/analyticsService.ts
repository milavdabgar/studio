interface MixpanelAPI {
  track: (eventName: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string) => void;
  people: {
    set: (properties: Record<string, unknown>) => void;
  };
}

interface WindowWithMixpanel extends Window {
  mixpanel?: MixpanelAPI;
}

interface WindowWithGtag extends Window {
  gtag?: (
    command: string,
    targetId: string,
    config?: Record<string, unknown>
  ) => void;
}

export interface EventType {
  PAGE_VIEW: 'page_view';
  CLICK: 'click';
  FORM_SUBMIT: 'form_submit';
  PURCHASE: 'purchase';
  SIGNUP: 'signup';
  LOGIN: 'login';
  LOGOUT: 'logout';
  SEARCH: 'search';
  DOWNLOAD: 'download';
  CUSTOM: string;
}

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface UserIdentity {
  userId?: string;
  email?: string;
  anonymousId?: string;
  traits?: Record<string, string | number | boolean>;
}

export interface AnalyticsEvent {
  type: string;
  properties: EventProperties;
  user: UserIdentity;
  timestamp: Date;
  sessionId?: string;
  context?: {
    page?: {
      url?: string;
      title?: string;
      referrer?: string;
    };
    device?: {
      type?: string;
      browser?: string;
      os?: string;
      screenResolution?: string;
    };
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    campaign?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
  };
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<void>;
  identify(user: UserIdentity): Promise<void>;
  page(properties: EventProperties): Promise<void>;
}

class GoogleAnalyticsProvider implements AnalyticsProvider {
  private measurementId: string;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (typeof window !== 'undefined' && (window as WindowWithGtag).gtag) {
      (window as WindowWithGtag).gtag!('event', event.type, {
        event_category: 'engagement',
        event_label: event.properties.label,
        value: event.properties.value,
        user_id: event.user.userId,
        ...event.properties,
      });
    }
  }

  async identify(user: UserIdentity): Promise<void> {
    if (typeof window !== 'undefined' && (window as WindowWithGtag).gtag) {
      (window as WindowWithGtag).gtag!('config', this.measurementId, {
        user_id: user.userId,
        custom_map: user.traits,
      });
    }
  }

  async page(properties: EventProperties): Promise<void> {
    if (typeof window !== 'undefined' && (window as WindowWithGtag).gtag) {
      (window as WindowWithGtag).gtag!('config', this.measurementId, {
        page_title: properties.title,
        page_location: properties.url,
      });
    }
  }
}

class MixpanelProvider implements AnalyticsProvider {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (typeof window !== 'undefined' && (window as WindowWithMixpanel).mixpanel) {
      (window as WindowWithMixpanel).mixpanel!.track(event.type, {
        ...event.properties,
        distinct_id: event.user.userId || event.user.anonymousId,
        time: event.timestamp.getTime(),
      });
    }
  }

  async identify(user: UserIdentity): Promise<void> {
    if (typeof window !== 'undefined' && (window as WindowWithMixpanel).mixpanel) {
      const mixpanel = (window as WindowWithMixpanel).mixpanel!;
      if (user.userId) {
        mixpanel.identify(user.userId);
      }
      if (user.traits) {
        mixpanel.people.set(user.traits);
      }
    }
  }

  async page(properties: EventProperties): Promise<void> {
    await this.track({
      type: 'page_view',
      properties,
      user: {},
      timestamp: new Date(),
    });
  }
}

export class AnalyticsService {
  private providers: AnalyticsProvider[] = [];
  private currentUser: UserIdentity | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  addGoogleAnalytics(measurementId: string): void {
    this.addProvider(new GoogleAnalyticsProvider(measurementId));
  }

  addMixpanel(token: string): void {
    this.addProvider(new MixpanelProvider(token));
  }

  async track(
    eventType: string,
    properties: EventProperties = {},
    user?: UserIdentity
  ): Promise<void> {
    const event: AnalyticsEvent = {
      type: eventType,
      properties,
      user: user || this.currentUser || {},
      timestamp: new Date(),
      sessionId: this.sessionId,
      context: this.getContext(),
    };

    const promises = this.providers.map(provider => 
      provider.track(event).catch(error => {
        console.error('Analytics provider error:', error);
      })
    );

    await Promise.allSettled(promises);
  }

  async identify(user: UserIdentity): Promise<void> {
    this.currentUser = user;

    const promises = this.providers.map(provider => 
      provider.identify(user).catch(error => {
        console.error('Analytics provider error:', error);
      })
    );

    await Promise.allSettled(promises);
  }

  async page(properties: EventProperties = {}): Promise<void> {
    const pageProperties = {
      url: typeof window !== 'undefined' ? window.location.href : '',
      title: typeof document !== 'undefined' ? document.title : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      ...properties,
    };

    const promises = this.providers.map(provider => 
      provider.page(pageProperties).catch(error => {
        console.error('Analytics provider error:', error);
      })
    );

    await Promise.allSettled(promises);
  }

  // Convenience methods for common events
  async trackPageView(url?: string): Promise<void> {
    await this.track('page_view', {
      url: url || (typeof window !== 'undefined' ? window.location.href : ''),
    });
  }

  async trackClick(element: string, location?: string): Promise<void> {
    await this.track('click', { element, location });
  }

  async trackFormSubmit(formName: string, success: boolean = true): Promise<void> {
    await this.track('form_submit', { form_name: formName, success });
  }

  async trackPurchase(
    orderId: string, 
    value: number, 
    currency: string = 'USD',
    items?: Array<{ id: string; name: string; price: number; quantity: number }>
  ): Promise<void> {
    await this.track('purchase', {
      order_id: orderId,
      value,
      currency,
      items: items ? JSON.stringify(items) : undefined,
    });
  }

  async trackSignup(method?: string): Promise<void> {
    await this.track('signup', { method });
  }

  async trackLogin(method?: string): Promise<void> {
    await this.track('login', { method });
  }

  async trackLogout(): Promise<void> {
    await this.track('logout');
  }

  async trackSearch(query: string, results?: number): Promise<void> {
    await this.track('search', { query, results });
  }

  async trackDownload(filename: string, fileType?: string): Promise<void> {
    await this.track('download', { filename, file_type: fileType });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getContext(): AnalyticsEvent['context'] {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      page: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      },
      device: {
        type: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
        screenResolution: `${screen.width}x${screen.height}`,
      },
      location: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      campaign: this.getCampaignData(),
    };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getCampaignData() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source') || undefined,
      medium: urlParams.get('utm_medium') || undefined,
      campaign: urlParams.get('utm_campaign') || undefined,
      term: urlParams.get('utm_term') || undefined,
      content: urlParams.get('utm_content') || undefined,
    };
  }

  reset(): void {
    this.currentUser = null;
    this.sessionId = this.generateSessionId();
  }

  getCurrentUser(): UserIdentity | null {
    return this.currentUser;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
