import { HttpError } from '../utils/httpError.js';

export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.admin) {
      return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication required prior to role check.'));
    }

    if (!roles.includes(req.admin.role)) {
      return next(new HttpError(403, 'FORBIDDEN', `Forbidden: Requires one of [${roles.join(', ')}] roles.`));
    }

    next();
  };
}

export default requireRole;
