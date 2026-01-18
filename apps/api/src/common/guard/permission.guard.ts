import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {UserRole} from "data-sources/generated/system/enums";

export enum Permission {
  // User Management
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',

  // Course Management
  CREATE_COURSE = 'create:course',
  READ_COURSE = 'read:course',
  UPDATE_COURSE = 'update:course',
  DELETE_COURSE = 'delete:course',
  PUBLISH_COURSE = 'publish:course',

  // Lesson Management
  CREATE_LESSON = 'create:lesson',
  UPDATE_LESSON = 'update:lesson',
  DELETE_LESSON = 'delete:lesson',

  // Quiz Management (AI-Generated)
  TAKE_QUIZ = 'take:quiz',
  VIEW_OWN_RESULTS = 'view:own-results',
  VIEW_ALL_STUDENT_RESULTS = 'view:all-student-results', // For admins only

  // Enrollment
  ENROLL_STUDENT = 'enroll:student',
  VIEW_PROGRESS = 'view:progress',

  // AI Features
  GENERATE_SUMMARY = 'generate:summary',
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Admins have all permissions
    ...Object.values(Permission),
  ],
  TEACHER: [
    Permission.READ_USER,
    Permission.CREATE_COURSE,
    Permission.READ_COURSE,
    Permission.UPDATE_COURSE,
    Permission.DELETE_COURSE,
    Permission.PUBLISH_COURSE,
    Permission.CREATE_LESSON,
    Permission.UPDATE_LESSON,
    Permission.DELETE_LESSON,
    Permission.ENROLL_STUDENT,
    Permission.VIEW_PROGRESS,
    Permission.VIEW_ALL_STUDENT_RESULTS, // Teachers can view their students' quiz results
    Permission.GENERATE_SUMMARY,
  ],
  STUDENT: [
    Permission.READ_USER,
    Permission.READ_COURSE,
    Permission.TAKE_QUIZ,
    Permission.VIEW_OWN_RESULTS,
    Permission.VIEW_PROGRESS,
    Permission.GENERATE_SUMMARY,
  ],
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
