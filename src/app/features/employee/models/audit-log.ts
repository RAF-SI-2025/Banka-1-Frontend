export interface AuditLog {
  id: number;
  actionType: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
  newValue: string;
  oldValue: string;
  targetName: string;
  targetType: string;
}
