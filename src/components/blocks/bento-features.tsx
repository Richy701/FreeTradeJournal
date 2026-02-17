'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  BarChart3,
  FileText,
  Shield,
  Target,
  Camera,
} from 'lucide-react';

export default function BentoFeatures() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Everything You Need
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <br />
            <span className="text-primary">Track Your Trades</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple yet powerful trading journal with essential features to help you improve your performance.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-fr"
        >
          {/* Feature 1 - Hero Card (Large) */}
          <motion.div variants={itemVariants} className="md:col-span-4 md:row-span-2">
            <Card className="p-8 h-full min-h-[280px] bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-6 h-full">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">Comprehensive Trade Logging</h3>
                  <p className="text-muted-foreground text-xl mb-8 leading-relaxed">
                    Log trades manually or import from your broker with full support for stocks, options, futures, and cryptocurrency trading.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="px-4 py-2">Manual Entry</Badge>
                    <Badge variant="secondary" className="px-4 py-2">CSV Import</Badge>
                    <Badge variant="secondary" className="px-4 py-2">All Asset Types</Badge>
                    <Badge variant="secondary" className="px-4 py-2">Broker Integration</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Feature 2 - Medium Card */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="p-6 h-full min-h-[200px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors group">
              <div className="p-3 rounded-xl bg-green-500/10 mb-6 w-fit group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Real-Time P&L</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Monitor performance with live updates and equity curves showing your progress over time.
              </p>
            </Card>
          </motion.div>

          {/* Feature 3 - Small Card */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="p-6 h-full min-h-[140px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors group">
              <div className="p-3 rounded-xl bg-blue-500/10 mb-4 w-fit group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Strategy Analysis</h3>
              <p className="text-muted-foreground">
                Compare different strategies across market conditions.
              </p>
            </Card>
          </motion.div>

          {/* Feature 4 - Wide Card */}
          <motion.div variants={itemVariants} className="md:col-span-4">
            <Card className="p-8 h-full min-h-[200px] bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40 transition-colors">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-red-500/10">
                  <Shield className="h-8 w-8 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4">Risk Management Tools</h3>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    Track your risk metrics, maximum drawdown, and exposure to make better risk-adjusted trading decisions.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className="px-3 py-1">Risk Metrics</Badge>
                    <Badge variant="secondary" className="px-3 py-1">Max Drawdown</Badge>
                    <Badge variant="secondary" className="px-3 py-1">Position Sizing</Badge>
                    <Badge variant="secondary" className="px-3 py-1">Exposure Tracking</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Feature 5 - Square Card */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="p-6 h-full min-h-[200px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors group">
              <div className="p-3 rounded-xl bg-purple-500/10 mb-6 w-fit group-hover:scale-110 transition-transform">
                <Camera className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Trade Screenshots</h3>
              <p className="text-muted-foreground leading-relaxed">
                Attach charts and notes to trades to remember your reasoning and learn from past decisions.
              </p>
            </Card>
          </motion.div>

          {/* Feature 6 - Small Card */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="p-6 h-full min-h-[140px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors group">
              <div className="p-3 rounded-xl bg-orange-500/10 mb-4 w-fit group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Export & Reports</h3>
              <p className="text-muted-foreground">
                Export data for tax reporting and analysis.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}