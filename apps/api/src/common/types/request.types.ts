import type { Request } from "express";
import { UserRole } from "@thinkbloom/data-sources";

/** What the JWT carries. Signed in AuthService.buildAuthResponse. */
export interface JwtPayload {
  /** The user's numeric id. */
  sub: number;
  email: string;
  role: UserRole;
}

/** What JwtStrategy.validate attaches to every authenticated request. */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

/** The user fields AuthService.buildAuthResponse returns on login. */
export interface RequestUser {
  id: number;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string | null;
  role: UserRole;
}

/** An Express request that has passed the JWT guard. */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
