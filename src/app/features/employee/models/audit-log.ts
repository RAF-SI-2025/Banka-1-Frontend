export interface AuditLog {
  id: number;
  actorName: string;
  actionType: string;
  performedBy: string;
  target: string;
  newValue: string;
  timestamp: string;
}