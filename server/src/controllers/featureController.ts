import { Request, Response } from 'express';
import { db } from '../services/database.js';

interface AuthRequest extends Request {
  auth?: {
    userId: string;
    isAdmin?: boolean;
  };
}

/**
 * Request beta access to a feature
 */
export const requestBetaAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { featureId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if feature exists and is in private_beta status
    const { data: feature, error: featureError } = await db.client
      .from('features')
      .select('*')
      .eq('id', featureId)
      .single();

    if (featureError || !feature) {
      res.status(404).json({ error: 'Feature not found' });
      return;
    }

    // Check if user already has access
    const { data: existingAccess } = await db.client
      .from('user_feature_access')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    if (existingAccess) {
      res.status(400).json({ error: 'You already have access to this feature' });
      return;
    }

    // Check if request already exists
    const { data: existingRequest } = await db.client
      .from('beta_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    if (existingRequest) {
      res.status(400).json({
        error: 'Beta access request already submitted',
        requestId: existingRequest.id
      });
      return;
    }

    // Create beta request
    const requestId = 'beta_req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const { data: request, error: insertError } = await db.client
      .from('beta_requests')
      .insert({
        id: requestId,
        user_id: userId,
        feature_id: featureId
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({
      success: true,
      message: 'Beta access request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Error requesting beta access:', error);
    res.status(500).json({ error: 'Failed to submit beta access request' });
  }
};

/**
 * Check if user has access to a specific feature
 */
export const checkFeatureAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { featureSlug } = req.params;
    const userId = req.auth?.userId;
    const isAdmin = req.auth?.isAdmin || false;

    console.log('[checkFeatureAccess] Starting check:', {
      featureSlug,
      userId,
      isAdmin
    });

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get feature by slug
    const { data: feature, error: featureError } = await db.client
      .from('features')
      .select('*')
      .eq('slug', featureSlug)
      .single();

    console.log('[checkFeatureAccess] Feature lookup:', {
      feature,
      featureError
    });

    if (featureError || !feature) {
      res.status(404).json({ error: 'Feature not found' });
      return;
    }

    // Admins always have access
    if (isAdmin) {
      console.log('[checkFeatureAccess] Admin access granted');
      res.json({
        success: true,
        data: {
          hasAccess: true,
          feature,
          reason: 'admin'
        }
      });
      return;
    }

    // Check feature status
    if (feature.status === 'live' || feature.status === 'beta') {
      console.log('[checkFeatureAccess] Public access granted:', feature.status);
      res.json({
        success: true,
        data: {
          hasAccess: true,
          feature,
          reason: 'public'
        }
      });
      return;
    }

    if (feature.status === 'in_development') {
      console.log('[checkFeatureAccess] In development - no access');
      res.json({
        success: true,
        data: {
          hasAccess: false,
          feature,
          reason: 'in_development'
        }
      });
      return;
    }

    // For private_beta, check if user has been granted access
    const { data: access, error: accessError } = await db.client
      .from('user_feature_access')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_id', feature.id)
      .single();

    console.log('[checkFeatureAccess] user_feature_access query:', {
      userId,
      featureId: feature.id,
      access,
      accessError
    });

    // Check if user has requested access
    const { data: betaRequest, error: betaRequestError } = await db.client
      .from('beta_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_id', feature.id)
      .single();

    console.log('[checkFeatureAccess] beta_requests query:', {
      betaRequest,
      betaRequestError
    });

    const responseData = {
      hasAccess: !!access,
      feature,
      reason: access ? 'granted' : 'private_beta',
      hasPendingRequest: betaRequest && !betaRequest.granted_at,
      requestedAt: betaRequest?.requested_at
    };

    console.log('[checkFeatureAccess] Final response:', responseData);

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ error: 'Failed to check feature access' });
  }
};

/**
 * Get all features with user's access status
 */
export const getAllFeatures = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    const isAdmin = req.auth?.isAdmin || false;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: features, error: featuresError } = await db.client
      .from('features')
      .select('*')
      .order('created_at', { ascending: false });

    if (featuresError) {
      throw featuresError;
    }

    // Enrich with access information
    const enrichedFeatures = await Promise.all((features || []).map(async (feature: any) => {
      // Admins always have access
      if (isAdmin) {
        return { ...feature, hasAccess: true, reason: 'admin' };
      }

      // Public features
      if (feature.status === 'live' || feature.status === 'beta') {
        return { ...feature, hasAccess: true, reason: 'public' };
      }

      // In development - no access
      if (feature.status === 'in_development') {
        return { ...feature, hasAccess: false, reason: 'in_development' };
      }

      // Private beta - check granted access
      const { data: access } = await db.client
        .from('user_feature_access')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_id', feature.id)
        .single();

      const { data: betaRequest } = await db.client
        .from('beta_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_id', feature.id)
        .single();

      return {
        ...feature,
        hasAccess: !!access,
        reason: access ? 'granted' : 'private_beta',
        hasPendingRequest: betaRequest && !betaRequest.granted_at,
        requestedAt: betaRequest?.requested_at
      };
    }));

    res.json({ features: enrichedFeatures });
  } catch (error) {
    console.error('Error getting features:', error);
    res.status(500).json({ error: 'Failed to get features' });
  }
};

/**
 * Get user's notifications
 */
export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    const { unreadOnly } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let query = db.client
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify notification belongs to user
    const { data: notification } = await db.client
      .from('user_notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    // Mark as read
    const { error } = await db.client
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { error } = await db.client
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};
