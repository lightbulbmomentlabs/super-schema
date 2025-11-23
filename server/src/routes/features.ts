import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  requestBetaAccess,
  checkFeatureAccess,
  getAllFeatures,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/featureController.js';

const router = Router();

// All feature routes require authentication
router.use(authMiddleware);

// GET /api/notifications - Get user's notifications (must be first to avoid conflict with getAllFeatures)
router.get('/notifications', getUserNotifications);

// PATCH /api/notifications/read-all - Mark all notifications as read (must be before :notificationId route)
router.patch('/notifications/read-all', markAllNotificationsRead);

// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch('/notifications/:notificationId/read', markNotificationRead);

// GET /api/features - Get all features with user's access status
router.get('/', getAllFeatures);

// POST /api/features/:featureId/request-beta - Request beta access to a feature
router.post('/:featureId/request-beta', requestBetaAccess);

// GET /api/features/:featureSlug/access - Check if user has access to a feature
router.get('/:featureSlug/access', checkFeatureAccess);

export default router;
