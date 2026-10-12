// Role-based access control middleware

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
}

export const requireMentor = requireRole('mentor', 'admin');
export const requireAdmin = requireRole('admin');
export const requireAny = requireRole('student', 'mentor', 'admin');
