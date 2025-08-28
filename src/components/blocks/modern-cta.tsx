'use client';

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  ArrowRight, 
  TrendingUp, 
  Star,
  Users,
  CheckCircle2,
  Sparkles 
} from 'lucide-react';

export default function ModernCTA() {
  const floatingVariants = {
    animate: {
      y: [0, -10, 0]
    }
  };

  const stats = [
    { icon: Users, value: "10K+", label: "Active Traders" },
    { icon: TrendingUp, value: "94%", label: "Success Rate" },
    { icon: Star, value: "4.9", label: "User Rating" },
  ];

  return (
    <section className="relative py-32 px-4 bg-gradient-to-b from-background via-background to-primary/5 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 text-sm px-4 py-2 bg-primary/10 border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Always Free
            </Badge>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Start Your Journey to
              <br />
              <span className="text-primary">Trading Excellence</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Join thousands of traders who are using TradeVault for free to track their performance, 
              analyze their trades, and improve their results with data-driven insights.
            </p>
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/dashboard">
              <Button 
                size="lg" 
                className="text-lg px-10 py-4 h-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Start Free Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-10 py-4 h-auto border-2 hover:bg-muted/50 transition-all duration-300"
            >
              Watch Demo
            </Button>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">No Setup Required</h3>
            <p className="text-muted-foreground">Start logging trades immediately with our intuitive interface</p>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">100% Free Forever</h3>
            <p className="text-muted-foreground">All core features available at no cost, no premium tiers or hidden fees</p>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Bank-Level Security</h3>
            <p className="text-muted-foreground">Your trading data is encrypted and stored securely</p>
          </Card>
        </motion.div>

        {/* Floating Elements */}
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          className="absolute top-10 right-10 opacity-20"
        >
          <TrendingUp className="w-16 h-16 text-primary" />
        </motion.div>
        
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          className="absolute bottom-10 left-10 opacity-20"
          style={{ animationDelay: '1.5s' }}
        >
          <Star className="w-12 h-12 text-primary" />
        </motion.div>

        {/* Final Call to Action */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-muted-foreground mb-4">
            Ready to start tracking your trades for free?
          </p>
          <p className="text-sm text-muted-foreground/70">
            No credit card required • No subscriptions • Always free
          </p>
        </motion.div>
      </div>
    </section>
  );
}