import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Loader2 } from 'lucide-react';
import { FeaturePreview } from './FeaturePreview';
import { AIAnalyticsPreview } from './AIAnalyticsPreview';

interface FeatureGateProps {
  featureSlug: string;
  children: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * FeatureGate component - Controls access to features based on status and user permissions
 *
 * Feature Status Flow:
 * - in_development: Only admins can see the feature
 * - private_beta: Preview page shown unless user has been granted access or is admin
 * - beta: Feature shown to all users with beta badge
 * - live: Feature shown normally to all users
 */
export function FeatureGate({ featureSlug, children, loadingFallback }: FeatureGateProps) {
  const { hasAccess, feature, isLoading, hasPendingRequest, requestBeta, isRequestingBeta } = useFeatureAccess(featureSlug);
  const isAdmin = useIsAdmin();
  const [searchParams] = useSearchParams();

  // Check for admin preview mode
  const isAdminPreviewMode = isAdmin && searchParams.get('preview') === 'true';

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {loadingFallback || (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading feature...</p>
          </div>
        )}
      </div>
    );
  }

  // If feature not found, show error
  if (!feature) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Feature Not Found</h2>
          <p className="text-muted-foreground">This feature does not exist.</p>
        </div>
      </div>
    );
  }

  // Admins always have access (unless in preview mode)
  if (isAdmin && !isAdminPreviewMode) {
    return <>{children}</>;
  }

  // Handle different feature statuses
  switch (feature.status) {
    case 'in_development':
      // Only admins can access features in development
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Feature In Development</h2>
            <p className="text-muted-foreground">This feature is currently under development.</p>
          </div>
        </div>
      );

    case 'private_beta':
      // Show preview page unless user has been granted access
      if (!hasAccess) {
        // Use custom preview for AI Analytics
        if (featureSlug === 'ai-analytics') {
          return (
            <>
              {isAdminPreviewMode && (
                <div className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-yellow-500/90 text-yellow-950 text-sm font-medium shadow-lg">
                  👤 Admin Preview Mode
                </div>
              )}
              <AIAnalyticsPreview
                feature={feature}
                hasPendingRequest={hasPendingRequest}
                onRequestAccess={() => requestBeta(feature.id)}
                isRequesting={isRequestingBeta}
              />
            </>
          );
        }

        // Use generic preview for other features
        return (
          <>
            {isAdminPreviewMode && (
              <div className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-yellow-500/90 text-yellow-950 text-sm font-medium shadow-lg">
                👤 Admin Preview Mode
              </div>
            )}
            <FeaturePreview
              feature={feature}
              hasPendingRequest={hasPendingRequest}
              onRequestAccess={() => requestBeta(feature.id)}
              isRequesting={isRequestingBeta}
            />
          </>
        );
      }
      // User has access, show feature
      return <>{children}</>;

    case 'beta':
    case 'live':
      // Feature is public, show it
      return <>{children}</>;

    default:
      // Unknown status, deny access
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You do not have access to this feature.</p>
          </div>
        </div>
      );
  }
}
