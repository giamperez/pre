import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // We expect the user to be appended by JwtAuthGuard before this guard runs
    if (!user) {
      throw new ForbiddenException('No user found');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Requiere privilegios de administrador');
    }

    return true;
  }
}
