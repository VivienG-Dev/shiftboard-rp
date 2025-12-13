import { Injectable } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class UserService {
  getProfile(session: UserSession) {
    return { user: session.user };
  }

  getPublic() {
    return { message: 'Public route' };
  }

  getOptional(session?: UserSession | null) {
    return { authenticated: !!session };
  }
}
