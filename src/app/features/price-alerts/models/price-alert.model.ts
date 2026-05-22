export type PriceAlertCondition = 'ABOVE' | 'BELOW' | 'DAILY_DROP_PERCENT';
export type PriceAlertNotificationType = 'IN_APP' | 'EMAIL' | 'SMS';

export interface SecurityForAlert {
  id: number;
  ticker: string;
  name: string;
  price: number;
  change?: number;
  changePercent?: number;
  currency?: string;
}

export interface PriceAlert {
  id: string;
  securityId: number;
  ticker: string;
  securityName: string;
  currentPriceAtCreation: number;
  condition: PriceAlertCondition;
  threshold: number;
  notificationType: PriceAlertNotificationType;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface CreatePriceAlertRequest {
  security: SecurityForAlert;
  condition: PriceAlertCondition;
  threshold: number;
  notificationType: PriceAlertNotificationType;
}

