import jwt from 'jsonwebtoken';
import prisma from '../db.js';

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
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true },
      });
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
