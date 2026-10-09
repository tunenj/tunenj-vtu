// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verify the Bearer access token and attach the user to `req.user`.
 *
 * @route   All protected routes
 * @access  Private
 * @header  Authorization: Bearer <accessToken>
 *
 * On success:  sets `req.user` (a Mongoose doc without the password field)
 * On failure:  returns 401 with { success: false, message }
 */
const protect = async (req, res, next) => {
  try {
    // ─── 1. Extract the token ────────────────────────────────────────────
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim(); // "Bearer ".length === 7
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    // ─── 2. Verify the token ─────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED', // lets the app trigger a refresh
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token payload',
      });
    }

    // ─── 3. Load the user ────────────────────────────────────────────────
    const user = await User.findById(decoded.id).select('-password -pin');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    // ─── 4. Make sure the account is actually verified ───────────────────
    if (!user.isEmailVerified && !user.isPhoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your account to continue.',
        needsVerification: true,
        email: user.email,
      });
    }

    // ─── 5. Attach and continue ──────────────────────────────────────────
    req.user = user;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
    });
  }
};

/**
 * Role-based access control.
 * Use AFTER `protect`:
 *   router.post('/admin/thing', protect, authorize('admin'), handler)
 *
 * @param  {...string} roles  Allowed roles, e.g. 'admin', 'reseller'
 * @returns {Function}        Express middleware
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no user context',
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
    });
  }

  return next();
};

/**
 * Optional auth — attach `req.user` if a valid token is present,
 * otherwise continue as an anonymous request.
 * Useful for endpoints that behave differently for logged-in users
 * (e.g. public product listings that show "favorited" state).
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7).trim();
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return next();

    const user = await User.findById(decoded.id).select('-password -pin');
    if (user) req.user = user;

    return next();
  } catch {
    // Silently ignore bad/expired tokens on optional routes
    return next();
  }
};

export default protect;