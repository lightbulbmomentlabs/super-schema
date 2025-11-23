import { motion } from 'framer-motion';
import { Rocket, Check, Eye, TrendingUp, Sparkles, CheckCircle, Bell, Mail } from 'lucide-react';
import MiniCrawlerActivityChart from './charts/MiniCrawlerActivityChart';
import AnimatedCoverageScore from './charts/AnimatedCoverageScore';
import SampleMetricsTable from './charts/SampleMetricsTable';

interface AIAnalyticsPreviewProps {
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

export function AIAnalyticsPreview({
  feature,
  hasPendingRequest,
  onRequestAccess,
  isRequesting
}: AIAnalyticsPreviewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Private Beta</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-4 pb-2 leading-tight">
            Is AI Actually Finding Your Content?
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Track ChatGPT, Perplexity, Gemini, and other AI crawlers using your existing Google Analytics 4 data. No setup required.
          </p>
        </motion.div>

        {/* CTA Section or Confirmation - Replaces in same position */}
        {!hasPendingRequest ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center shadow-xl mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Want Early Access?
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect your Google Analytics 4 account to AI Analytics. See exactly which pages AI is crawling (and which ones it's ignoring).
            </p>

            <button
              onClick={onRequestAccess}
              disabled={isRequesting}
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 mb-3"
            >
              {isRequesting ? (
                <>
                  <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Requesting Access...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5 mr-2" />
                  Request Private Beta Access
                </>
              )}
            </button>

            <p className="text-sm text-muted-foreground">
              Requires a Google Analytics 4 account
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center shadow-xl mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="inline-flex items-center justify-center rounded-full bg-green-500/10 p-4 mb-6"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-4">You're on the List!</h2>

            <div className="max-w-2xl mx-auto space-y-4 mb-8">
              <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/30">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Request submitted</p>
                  <p className="text-sm text-muted-foreground">
                    We're reviewing requests daily—you'll hear from us soon
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/30">
                <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Watch for your notification</p>
                  <p className="text-sm text-muted-foreground">
                    Check the bell icon when you're logged in
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/30">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">We'll email you too</p>
                  <p className="text-sm text-muted-foreground">
                    Double notification = you won't miss it
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              <strong>Psst:</strong> Paying customers get priority access 😉
            </p>

            <button
              onClick={() => window.location.href = '/dashboard/credits?purchase=true'}
              className="px-6 py-3 rounded-lg font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              Purchase a Credit Pack
            </button>
          </motion.div>
        )}

        {/* Visual Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl mb-12"
        >
          {/* Crawler Activity Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Crawler Activity
            </h3>
            <div className="h-[240px]">
              <MiniCrawlerActivityChart />
            </div>
          </div>

          {/* Sample Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Pages by AI Activity</h3>
            <SampleMetricsTable />
          </div>

          {/* Demo Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground italic">
              ↑ This is sample data. Your real dashboard will show live data from your site.
            </p>
          </div>
        </motion.div>

        {/* Coverage Score - Featured Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-2xl p-8 md:p-12 shadow-lg mb-12 overflow-hidden"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Your AI Coverage Score
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              What percentage of your pages have AI actually found? Now you'll know.
            </p>
          </div>

          <AnimatedCoverageScore />
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">See Who's Crawling</h3>
            <p className="text-sm text-muted-foreground">
              Know exactly which AI engines are discovering your content—ChatGPT, Perplexity, Gemini, you name it.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Find the Gaps</h3>
            <p className="text-sm text-muted-foreground">
              See which pages AI is missing. Fix them before your competition does.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Uses Your GA4 Data</h3>
            <p className="text-sm text-muted-foreground">
              Plugs right into your existing Google Analytics 4. One click, zero configuration, done.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
