import { UserRole } from '../../common/constants/roles.constant';

export interface AuthenticatedUser {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
}

export interface JwtAccessPayload {
  sub: string;
  orgId: string;
  email: string;
  role: UserRole;
}

export interface JwtRefreshPayload {
  sub: string;
}
