export interface AuditLog {
  id: number;
  actionType: string;
  performedBy: string;
  target: string;
  newValue: string;
  timestamp: string;
}