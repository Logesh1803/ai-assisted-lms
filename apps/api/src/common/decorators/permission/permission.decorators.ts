import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../guard/permission.guard';

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);
