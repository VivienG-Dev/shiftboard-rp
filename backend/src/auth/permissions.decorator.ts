import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { PermissionKey } from './permissions';
import { PERMISSIONS_ANY_KEY, PERMISSIONS_KEY } from './permissions.constants';
import { PermissionsGuard } from './permissions.guard';

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  applyDecorators(SetMetadata(PERMISSIONS_KEY, permissions), UseGuards(PermissionsGuard));

export const RequireAnyPermissions = (...permissions: PermissionKey[]) =>
  applyDecorators(SetMetadata(PERMISSIONS_ANY_KEY, permissions), UseGuards(PermissionsGuard));
