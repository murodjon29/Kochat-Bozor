import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../enum';

@Injectable()
export class SelfGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const paramId = parseInt(req.params.id, 10);

    if (!user || !user.id)
      throw new ForbiddenException('User not authenticated');

    if (user.role === Role.SUPERADMIN || user.role === Role.ADMIN) {
      return true;
    }

    if (paramId !== user.id) {
      throw new ForbiddenException('You can only access your own resources');
    }
    return true;
  }
}
