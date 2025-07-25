import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '../enum';

@Injectable()
export class SelfGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (
      req.user?.role ||
      req.user?.role === Role.SUPERADMIN ||
      req.user?.role === Role.ADMIN
    )
      return true;
    if (req.params.id !== req.user.id)
      throw new ForbiddenException('Forbidden user');
    return true;
  }
}
