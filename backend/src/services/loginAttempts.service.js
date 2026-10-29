import { recordLoginAttempt, countRecentFailures } from '../repositories/loginAttempts.repo.js';
import { HttpError } from '../utils/httpError.js';

export async function checkLockout(email) {
  const failureCount = await countRecentFailures(email, 15);
  if (failureCount >= 5) {
    throw HttpError.accountLocked(
      'Account temporarily locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.',
      900
    );
  }
}

export async function logAttempt(email, ipHash, success) {
  return recordLoginAttempt(email, ipHash, success);
}

export default { checkLockout, logAttempt };
