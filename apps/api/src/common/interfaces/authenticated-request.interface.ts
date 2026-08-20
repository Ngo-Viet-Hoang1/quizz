import { Request } from 'express';
import { UserDocument } from '../../modules/users/schemas/user.schema';

export interface AuthContext {
  orgId: string | null;
  orgRole?: string | null;
  orgPermissions?: string[];
  userId: string;
  user: UserDocument;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
  user: UserDocument;
}
