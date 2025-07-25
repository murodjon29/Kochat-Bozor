import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization;
    if (!auth) {
      throw new UnauthorizedException('Token not found');
    }
    const bearer = auth.split(' ')[0];
    const token = auth.split(' ')[1];
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Unauthorized');
    }
    let user: any;
    try {
      user = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      req.user = user;
    } catch (error) {
      throw new UnauthorizedException('Token expired');
    }
    return true;
  }
}
