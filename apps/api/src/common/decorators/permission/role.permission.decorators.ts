import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'data-sources/generated/system/enums';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
