'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Zap,
  Target,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  Star
} from 'lucide-react';

export default function WhyChooseSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      },
    },
  };

  const benefits = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your trading data is encrypted with enterprise-grade security. We never share your information and comply with industry standards.",
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10"
    },
    {
      icon: Zap,
      title: "Lightning Fast Performance",
      description: "Optimized for speed with sub-second loading times. Focus on trading decisions, not waiting for data to load.",
      gradient: "from-yellow-500/20 to-orange-500/20",
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-500/10"
    },
    {
      icon: Target,
      title: "Smart Goal Tracking",
      description: "Set personalized trading goals and get real-time progress updates. Stay disciplined and achieve consistent results.",
      gradient: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10"
    }
  ];

  const stats = [
    { icon: TrendingUp, value: "92%", label: "Performance Improvement", sublabel: "within 30 days" },
    { icon: Users, value: "10K+", label: "Active Traders", sublabel: "trust FreeTradeJournal" },
    { icon: Award, value: "4.9★", label: "User Rating", sublabel: "from 500+ reviews" }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Professional Traders
            <br />
            <span className="bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
              Choose FreeTradeJournal
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Join thousands of successful traders who rely on FreeTradeJournal for superior performance, 
            security, and insights that drive consistent profits.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Benefits Cards */}
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className={`p-6 bg-gradient-to-br ${benefit.gradient} border-0 hover:shadow-lg transition-all duration-300 group`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${benefit.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className={`h-6 w-6 ${benefit.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats & Social Proof */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Main Stat Card */}
            <Card className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-green-500/10 border-primary/20 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl" />
              
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <div className="text-6xl font-bold text-primary mb-2">92%</div>
                <h3 className="text-2xl font-bold mb-2">Performance Boost</h3>
                <p className="text-muted-foreground text-lg">
                  of traders improved their results within 30 days of using FreeTradeJournal 
                  to track and analyze their trades
                </p>
                <div className="flex items-center justify-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">Based on user surveys</span>
                </div>
              </div>
            </Card>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.slice(1).map((stat, index) => (
                <Card key={index} className="p-6 bg-card hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors group">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-foreground mb-1">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-4 pt-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                256-bit Encryption
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                99.9% Uptime
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}