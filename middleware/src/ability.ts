import { createMongoAbility, type MongoAbility, type RawRuleOf } from '@casl/ability';
import { type ErpAction, type ErpSubjectCode } from './contracts/permissions.js';

export type Action = ErpAction;
export type Subject = ErpSubjectCode | 'all' | (string & {});
export type AppAbility = MongoAbility<[Action, Subject]>;
export type StoredRule = RawRuleOf<AppAbility>;

const SELF = { userId: '${user.id}' };

// Reference roles every tenant needs. These are access-control definitions, not sample data.
export const SYSTEM_ROLES: { code: string; name: string; description: string; permissions: StoredRule[] }[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Unrestricted access to every module and setting',
    permissions: [{ action: 'manage', subject: 'all' }],
  },
  {
    code: 'USER_ADMIN',
    name: 'User Administrator',
    description: 'Provisions users and manages plants, but not roles',
    permissions: [
      { action: 'manage', subject: 'User' },
      { action: 'read', subject: 'Role' },
      { action: 'manage', subject: 'Plant' },
      { action: 'read', subject: 'AuditLog' },
      { action: 'read', subject: 'Dashboard' },
      { action: 'manage', subject: 'Preference', conditions: SELF },
      { action: 'read', subject: 'Item' },
      { action: 'read', subject: 'Supplier' },
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Warehouse' },
      { action: 'read', subject: 'Machine' },
      { action: 'read', subject: 'BillOfMaterial' },
      { action: 'read', subject: 'WorkOrder' },
      { action: 'read', subject: 'SalesOrder' },
      { action: 'read', subject: 'PurchaseOrder' },
      { action: 'read', subject: 'SecurityPolicy' },
      { action: 'manage', subject: 'Session', conditions: SELF },
    ],
  },
  {
    code: 'STANDARD_USER',
    name: 'Standard User',
    description: 'Can manage only their own profile and preferences',
    permissions: [
      { action: 'read', subject: 'Plant' },
      { action: 'read', subject: 'Dashboard' },
      { action: 'manage', subject: 'Preference', conditions: SELF },
      { action: 'manage', subject: 'Session', conditions: SELF },
      { action: 'read', subject: 'Item' },
      { action: 'read', subject: 'Supplier' },
      { action: 'read', subject: 'Customer' },
      { action: 'read', subject: 'Warehouse' },
      { action: 'read', subject: 'Machine' },
      { action: 'read', subject: 'BillOfMaterial' },
      { action: 'read', subject: 'WorkOrder' },
      { action: 'read', subject: 'SalesOrder' },
      { action: 'read', subject: 'PurchaseOrder' },
    ],
  },
];

// Expands ${user.id} placeholders so stored conditions stay data, never code.
function interpolate(rules: StoredRule[], userId: string): StoredRule[] {
  return JSON.parse(JSON.stringify(rules), (_k, v) => (v === '${user.id}' ? userId : v));
}

export function buildAbility(rules: StoredRule[], userId: string): AppAbility {
  return createMongoAbility<AppAbility>(interpolate(rules, userId) as any);
}
