import { Controller, Get } from '@nestjs/common';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
} from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return this.userService.getProfile(session);
  }
  @Get('public')
  @AllowAnonymous() // Allow anonymous access
  async getPublic() {
    return this.userService.getPublic();
  }
  @Get('optional')
  @OptionalAuth() // Authentication is optional
  async getOptional(@Session() session?: UserSession | null) {
    return this.userService.getOptional(session);
  }
}
