import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { isCognitoConfigured, verifyCognitoIdToken, syncCognitoUserToDb } from '../lib/cognito.js';

const ROLES = ['STUDENT', 'RECRUITER', 'OFFICER'];

export function requireAuth(...roles) {
  if (roles.length && roles.some((r) => !ROLES.includes(r))) {
    throw new Error(`Bad role in requireAuth(${roles.join(', ')})`);
  }
  return async (req, _res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return next({ status: 401, message: 'Not signed in' });

      let user = null;

      // 1. Try Amazon Cognito Token Verification if token has Cognito characteristics
      const isCognitoCandidate = isCognitoConfigured && (
        process.env.AUTH_MODE === 'cognito' || 
        token.length > 500 // Cognito ID tokens are RSA-256 signed and usually > 800 chars
      );

      if (isCognitoCandidate) {
        try {
          const cognitoPayload = await verifyCognitoIdToken(token);
          user = await syncCognitoUserToDb(cognitoPayload);
        } catch (cognitoErr) {
          // If not configured or failed, fall back to local HMAC JWT
        }
      }

      // 2. Fall back to Local HMAC-SHA256 JWT
      if (!user) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, name: true, role: true },
        });
      }

      if (!user) return next({ status: 401, message: 'Invalid session' });
      if (roles.length && !roles.includes(user.role)) {
        return next({ status: 403, message: `Requires role: ${roles.join(' or ')}` });
      }
      req.user = user;
      next();
    } catch (err) {
      next({ status: 401, message: 'Invalid or expired token' });
    }
  };
}
