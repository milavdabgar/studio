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
  traits?: Record<string, unknown>;
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
