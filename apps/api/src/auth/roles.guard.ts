import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user found');
    }

    // superadmin siempre tiene acceso completo
    if (user.role === 'superadmin') {
      return true;
    }

    // Si no se especificaron roles requeridos explícitos, permitir acceso a cualquier usuario autenticado
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Verificar si el rol del usuario (o su equivalente usuario/ventas) cumple los roles requeridos
    const isAllowed = requiredRoles.some(r => {
      if (r === user.role) return true;
      if (r === 'usuario' && (user.role === 'usuario' || user.role === 'ventas')) return true;
      if (r === 'ventas' && (user.role === 'usuario' || user.role === 'ventas')) return true;
      return false;
    });

    if (!isAllowed) {
      throw new ForbiddenException('No tienes permisos suficientes para realizar esta acción');
    }

    return true;
  }
}
