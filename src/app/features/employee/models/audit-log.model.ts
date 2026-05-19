/**
 * WP-23 (Celina 3): Audit Log model.
 *
 * Mirrors the DTOs returned by the JWT-secured audit endpoint exposed through
 * the gateway at `GET /audit`. The {@link AuthInterceptor} attaches the token;
 * the endpoint is restricted to administrators and supervisors.
 *
 * <p>The audit log records security-relevant administrative actions — order
 * approvals/declines, actuary-limit changes, employee-permission changes and
 * tax-run triggers — so that an administrator can review who did what, when.
 */

/**
 * One audited action type. Mirrors the backend enum; each value gets a
 * readable Serbian label via {@link AUDIT_ACTION_LABELS}.
 */
export type AuditActionType =
  | 'ORDER_APPROVED'
  | 'ORDER_DECLINED'
  | 'AGENT_LIMIT_CHANGED'
  | 'AGENT_USED_LIMIT_RESET'
  | 'AGENT_NEED_APPROVAL_CHANGED'
  | 'EMPLOYEE_PERMISSIONS_CHANGED'
  | 'TAX_RUN_MANUAL'
  | 'TAX_RUN_SCHEDULED';

/** Every audited action type, in display order — drives the filter select. */
export const AUDIT_ACTION_TYPES: AuditActionType[] = [
  'ORDER_APPROVED',
  'ORDER_DECLINED',
  'AGENT_LIMIT_CHANGED',
  'AGENT_USED_LIMIT_RESET',
  'AGENT_NEED_APPROVAL_CHANGED',
  'EMPLOYEE_PERMISSIONS_CHANGED',
  'TAX_RUN_MANUAL',
  'TAX_RUN_SCHEDULED',
];

/** Readable Serbian label for each audited action type. */
export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  ORDER_APPROVED: 'Order odobren',
  ORDER_DECLINED: 'Order odbijen',
  AGENT_LIMIT_CHANGED: 'Promena limita agenta',
  AGENT_USED_LIMIT_RESET: 'Reset iskoriscenog limita agenta',
  AGENT_NEED_APPROVAL_CHANGED: 'Promena obaveze odobrenja agenta',
  EMPLOYEE_PERMISSIONS_CHANGED: 'Promena permisija zaposlenog',
  TAX_RUN_MANUAL: 'Rucno pokretanje poreza',
  TAX_RUN_SCHEDULED: 'Zakazano pokretanje poreza',
};

/** One row of the audit log. */
export interface AuditLogEntry {
  id: number;
  /** Id of the user who performed the action. */
  actorId: number;
  /** Display name of the actor — convenience field for the list. */
  actorName: string;
  actionType: AuditActionType;
  /** Type of the entity the action targeted, e.g. `ORDER` / `EMPLOYEE`. */
  targetType: string;
  /** Id of the targeted entity. */
  targetId: number;
  /** Free-form human-readable detail of the action. */
  details: string;
  /** ISO-8601 timestamp of when the action happened. */
  createdAt: string;
}

/** Query filter for `GET /audit`. All fields optional. */
export interface AuditLogFilter {
  actionType?: AuditActionType;
  /** Filter by the id of the acting user. */
  actorId?: number;
  /** ISO date (`yyyy-MM-dd`) lower bound on the action timestamp. */
  from?: string;
  /** ISO date (`yyyy-MM-dd`) upper bound on the action timestamp. */
  to?: string;
}

/**
 * Spring Data `Page` envelope returned by `GET /audit`.
 *
 * <p>The plain Spring `Page` shape — paging metadata flattened onto the root
 * object (`totalElements` / `totalPages` / `number` / `size`).
 */
export interface AuditLogPage {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
