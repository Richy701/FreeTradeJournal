import { SiteHeader } from '@/components/site-header';
import { Card, CardContent } from '@/components/ui/card';
import { Footer7 } from '@/components/ui/footer-7';
import { useThemePresets } from '@/contexts/theme-presets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faUser, faArrowLeft, faTag, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link, useParams } from 'react-router-dom';

export default function BlogPost() {
  const { themeColors } = useThemePresets();
  const { id } = useParams<{ id: string }>();

  const blogPosts = [
    {
      id: 1,
      title: "The Psychology of Trading: How Emotions Impact Your P&L",
      content: `
        <p>Trading is as much a psychological battle as it is a technical one. Understanding the emotional aspects of trading can be the difference between consistent profitability and devastating losses.</p>
        
        <h2>Common Emotional Trading Patterns</h2>
        
        <h3>1. Fear of Missing Out (FOMO)</h3>
        <p>FOMO is one of the most dangerous emotions in trading. It drives traders to enter positions without proper analysis, often at the worst possible times. Signs of FOMO trading include:</p>
        <ul>
          <li>Entering trades after significant price movements</li>
          <li>Increasing position sizes to "catch up" on missed opportunities</li>
          <li>Abandoning your trading plan to chase market momentum</li>
        </ul>
        
        <h3>2. Revenge Trading</h3>
        <p>After a losing trade, many traders feel the need to "get even" with the market. This emotional response leads to:</p>
        <ul>
          <li>Doubling down on losing positions</li>
          <li>Taking excessive risks to recover losses quickly</li>
          <li>Ignoring risk management rules</li>
        </ul>
        
        <h3>3. Overconfidence After Wins</h3>
        <p>Success can be as dangerous as failure. Overconfidence after winning streaks can lead to:</p>
        <ul>
          <li>Increasing position sizes beyond risk tolerance</li>
          <li>Becoming careless with entry and exit criteria</li>
          <li>Neglecting proper analysis</li>
        </ul>
        
        <h2>How to Combat Emotional Trading</h2>
        
        <h3>1. Maintain a Trading Journal</h3>
        <p>Document not just what you traded, but how you felt when making those decisions. This helps identify emotional patterns over time.</p>
        
        <h3>2. Use Strict Risk Management</h3>
        <p>Pre-define your position sizes, stop losses, and profit targets. Never deviate from these rules, regardless of how confident you feel.</p>
        
        <h3>3. Take Regular Breaks</h3>
        <p>Step away from the markets regularly, especially after significant wins or losses. This helps maintain emotional equilibrium.</p>
        
        <h3>4. Practice Mindfulness</h3>
        <p>Be aware of your emotional state before entering any trade. If you're feeling anxious, excited, or angry, it may be best to wait.</p>
        
        <h2>Using FreeTradeJournal for Emotional Analysis</h2>
        
        <p>FreeTradeJournal's AI-powered analysis can help identify emotional trading patterns in your data:</p>
        <ul>
          <li>Overtrading detection based on frequency and timing</li>
          <li>Revenge trading pattern identification</li>
          <li>FOMO detection through entry timing analysis</li>
          <li>Emotional state correlation with trade outcomes</li>
        </ul>
        
        <p>Remember: successful trading is about consistency, not hitting home runs. Focus on following your plan, managing risk, and learning from both wins and losses.</p>
      `,
      date: "2024-03-15",
      author: "FreeTradeJournal Team",
      category: "Psychology",
      readTime: "8 min read"
    },
    {
      id: 2,
      title: "Advanced Risk Management Strategies for Forex Traders",
      content: `
        <p>Risk management is the cornerstone of successful forex trading. While many traders focus on finding the perfect entry strategy, professional traders know that how you manage risk determines your long-term success.</p>
        
        <h2>The 1% Rule and Beyond</h2>
        
        <p>The classic 1% rule states that you should never risk more than 1% of your account on a single trade. However, successful risk management goes far deeper than this simple rule.</p>
        
        <h3>Position Sizing Calculations</h3>
        <p>Proper position sizing involves several factors:</p>
        <ul>
          <li><strong>Account Size:</strong> Your total trading capital</li>
          <li><strong>Risk Percentage:</strong> How much you're willing to lose (typically 1-2%)</li>
          <li><strong>Stop Loss Distance:</strong> Pips from entry to stop loss</li>
          <li><strong>Pip Value:</strong> Monetary value per pip for your chosen pair</li>
        </ul>
        
        <p><strong>Formula:</strong> Position Size = (Account Size × Risk %) ÷ (Stop Loss Distance × Pip Value)</p>
        
        <h2>Advanced Risk Management Techniques</h2>
        
        <h3>1. Risk-Reward Ratios</h3>
        <p>Maintain a minimum 1:2 risk-reward ratio. If you risk $100, aim to make at least $200. This allows you to be profitable even with a 40% win rate.</p>
        
        <h3>2. Correlation Risk</h3>
        <p>Avoid trading highly correlated pairs simultaneously. For example, EUR/USD and GBP/USD often move together, effectively doubling your exposure.</p>
        
        <h3>3. Time-Based Risk Management</h3>
        <p>Consider reducing position sizes during:</p>
        <ul>
          <li>Major news events</li>
          <li>Low liquidity periods (market opens/closes)</li>
          <li>Friday afternoon sessions</li>
          <li>Holiday periods</li>
        </ul>
        
        <h3>4. Drawdown Management</h3>
        <p>Implement rules for handling losing streaks:</p>
        <ul>
          <li>Reduce position sizes after 3 consecutive losses</li>
          <li>Take a break after losing 5% of your account</li>
          <li>Review and adjust strategy after 10% drawdown</li>
        </ul>
        
        <h2>Prop Firm Risk Management</h2>
        
        <p>If you're trading with prop firms like FTMO, Apex, or TopStep, additional risk considerations apply:</p>
        
        <h3>Daily Loss Limits</h3>
        <p>Most prop firms have daily loss limits (typically 5% of account). Always:</p>
        <ul>
          <li>Calculate your maximum position size based on daily limits</li>
          <li>Stop trading immediately when approaching daily limits</li>
          <li>Never risk more than 50% of your daily limit on a single trade</li>
        </ul>
        
        <h3>Maximum Drawdown Rules</h3>
        <p>Prop firms typically have 8-10% maximum drawdown rules. Monitor your high-water mark closely and adjust position sizes as your drawdown increases.</p>
        
        <h2>Technology for Risk Management</h2>
        
        <p>Modern traders use technology to enforce risk rules:</p>
        <ul>
          <li><strong>Position Size Calculators:</strong> Automate position sizing calculations</li>
          <li><strong>Risk Alerts:</strong> Get notified when approaching risk limits</li>
          <li><strong>Trade Journals:</strong> Track risk metrics and rule violations</li>
          <li><strong>Automated Stop Losses:</strong> Remove emotion from exit decisions</li>
        </ul>
        
        <p>FreeTradeJournal provides built-in risk management tools including position size calculators, risk alerts, and detailed risk analytics to help you maintain discipline and protect your capital.</p>
      `,
      date: "2024-03-10",
      author: "FreeTradeJournal Team",
      category: "Risk Management",
      readTime: "12 min read"
    }
  ];

  const post = blogPosts.find(p => p.id === parseInt(id || ''));

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-2xl font-bold">Article Not Found</h1>
            <p className="text-muted-foreground">The blog post you're looking for doesn't exist.</p>
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Back to Blog */}
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <FontAwesomeIcon icon={faTag} className="h-3 w-3 mr-1" />
                  {post.category}
                </span>
                <span className="text-sm text-muted-foreground">{post.readTime}</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
                  <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                  <span>{post.author}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div 
                className="prose prose-gray dark:prose-invert max-w-none"
                style={{
                  '--tw-prose-headings': themeColors.primary,
                  '--tw-prose-links': themeColors.primary,
                } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </CardContent>
          </Card>

          {/* Related Articles */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">More Articles</h3>
              <div className="space-y-3">
                {blogPosts.filter(p => p.id !== post.id).slice(0, 3).map((relatedPost) => (
                  <Link 
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.id}`}
                    className="block p-4 rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{relatedPost.category}</span>
                          <span>•</span>
                          <span>{relatedPost.readTime}</span>
                        </div>
                      </div>
                      <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <Footer7 
        logo={{
          url: "/",
          src: "",
          alt: "FreeTradeJournal",
          title: "FreeTradeJournal"
        }}
        description="Free, open-source trading journal for forex and futures traders. Track your performance, analyze patterns, and improve your trading with AI-powered insights."
        sections={[
          {
            title: "Product",
            links: [
              { name: "Features", href: "/#features" },
              { name: "Dashboard", href: "/dashboard" },
              { name: "Trade Log", href: "/trades" },
              { name: "Goals", href: "/goals" }
            ]
          },
          {
            title: "Resources",
            links: [
              { name: "Documentation", href: "/documentation" },
              { name: "Get Help", href: "https://t.me/+UI6uTKgfswUwNzhk" },
              { name: "Community", href: "#" },
              { name: "Blog", href: "/blog" }
            ]
          },
          {
            title: "Legal",
            links: [
              { name: "Privacy Policy", href: "/privacy" },
              { name: "Terms & Conditions", href: "/terms" },
              { name: "Cookie Policy", href: "/cookie-policy" }
            ]
          }
        ]}
        socialLinks={[
          // Add social links when available
        ]}
        copyright="© 2025 FreeTradeJournal. All rights reserved."
        legalLinks={[
          { name: "Terms and Conditions", href: "/terms" },
          { name: "Privacy Policy", href: "/privacy" }
        ]}
      />
    </div>
  );
}