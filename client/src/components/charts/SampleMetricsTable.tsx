import { motion } from 'framer-motion';
import { Bot, Sparkles, Zap } from 'lucide-react';

const samplePages = [
  {
    url: '/blog/ai-search-optimization-guide',
    crawlers: ['ChatGPT', 'Perplexity', 'Claude'],
    visits: 127,
    icon: Sparkles,
    iconColor: 'text-primary',
  },
  {
    url: '/products/schema-generator',
    crawlers: ['ChatGPT', 'Gemini'],
    visits: 89,
    icon: Bot,
    iconColor: 'text-blue-500',
  },
  {
    url: '/resources/seo-checklist',
    crawlers: ['Perplexity', 'Bing AI'],
    visits: 64,
    icon: Zap,
    iconColor: 'text-purple-500',
  },
];

export default function SampleMetricsTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="w-full"
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                Page
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                AI Crawlers
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">
                Visits
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {samplePages.map((page, index) => {
              const Icon = page.icon;
              return (
                <motion.tr
                  key={page.url}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${page.iconColor}`} />
                      <span className="text-sm text-foreground truncate max-w-[200px]">
                        {page.url}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {page.crawlers.map((crawler) => (
                        <span
                          key={crawler}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary"
                        >
                          {crawler}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {page.visits}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
