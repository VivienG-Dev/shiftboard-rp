export const PERMISSION_ALLOWLIST = [
  'company.read',
  'company.update',
  'company.archive',
  'members.read',
  'members.invite',
  'members.updateRole',
  'roles.manage',
  'inventory.read',
  'inventory.write',
  'inventory.snapshot.create',
  'salesCards.read',
  'salesCards.create',
  'salesCards.edit.anyUnlocked',
  'salesCards.edit.ownDraft',
  'salesCards.stop.anyDraft',
  'salesCards.stop.ownDraft',
  'salesCards.lock',
  'stats.read',
] as const;

export type PermissionKey = (typeof PERMISSION_ALLOWLIST)[number];
