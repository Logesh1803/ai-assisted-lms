import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@thinkbloom/data-sources";

export const Roles = (...roles: UserRole[]) => SetMetadata("roles", roles);
