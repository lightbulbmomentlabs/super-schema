import { Rocket, Check, Clock, Sparkles } from 'lucide-react';

interface FeaturePreviewProps {
  feature: {
    id: string;
    name: string;
    description: string;
    slug: string;
  };
  hasPendingRequest: boolean;
  onRequestAccess: () => void;
  isRequesting: boolean;
}

/**
 * FeaturePreview - Landing page shown to users when a feature is in private beta
 * Displays feature information and allows users to request beta access
 */
export function FeaturePreview({
  feature,
  hasPendingRequest,
  onRequestAccess,
  isRequesting
}: FeaturePreviewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="relative w-full max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center border-b border-border relative overflow-hidden">
          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 left-4 text-2xl animate-bounce">🚀</div>
            <div className="absolute top-6 right-6 text-2xl animate-bounce delay-100">✨</div>
            <div className="absolute bottom-6 left-8 text-2xl animate-bounce delay-200">⭐</div>
          </div>

          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{feature.name}</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Private Beta</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">About This Feature</h2>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="text-lg font-semibold mb-3">What You'll Get</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Early access to cutting-edge functionality before it's publicly available
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Direct influence on feature development through your feedback
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Priority support as we refine and improve the feature
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            {hasPendingRequest ? (
              <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Request Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    We'll notify you when access is granted
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={onRequestAccess}
                  disabled={isRequesting}
                  className="w-full h-12 text-base inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isRequesting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Requesting Access...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Request Private Beta Access
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Free for all users. We prioritize paying customers for faster access.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-8 pb-8">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Have questions? Contact{' '}
              <a href="mailto:support@superschema.ai" className="text-primary hover:underline">
                support@superschema.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
