import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer7 } from '@/components/ui/footer-7';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBlog, faCalendar, faUser, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [email, setEmail] = useState("");

  const blogPosts = [
    {
      id: 1,
      title: "The Psychology of Trading: How Emotions Impact Your P&L",
      excerpt: "Understanding the psychological aspects of trading is crucial for long-term success. Learn how to identify and overcome emotional trading patterns.",
      date: "2024-03-15",
      author: "FreeTradeJournal Team",
      category: "Psychology",
      readTime: "8 min read",
      featured: true
    },
    {
      id: 2,
      title: "Advanced Risk Management Strategies for Forex Traders",
      excerpt: "Discover professional risk management techniques used by successful forex traders and prop firm traders to protect capital and maximize returns.",
      date: "2024-03-10",
      author: "FreeTradeJournal Team",
      category: "Risk Management",
      readTime: "12 min read",
      featured: true
    },
    {
      id: 3,
      title: "How to Use Trading Journals to Improve Performance",
      excerpt: "A comprehensive guide to maintaining an effective trading journal and using data analytics to identify profitable patterns.",
      date: "2024-03-05",
      author: "FreeTradeJournal Team",
      category: "Education",
      readTime: "10 min read",
      featured: false
    },
    {
      id: 4,
      title: "Understanding Prop Firm Evaluation Metrics",
      excerpt: "Learn what prop firms like FTMO, Apex, and TopStep look for in trader evaluations and how to optimize your performance.",
      date: "2024-02-28",
      author: "FreeTradeJournal Team",
      category: "Prop Trading",
      readTime: "15 min read",
      featured: false
    },
    {
      id: 5,
      title: "Technical Analysis vs. Fundamental Analysis: Which is Better?",
      excerpt: "Explore the pros and cons of technical and fundamental analysis approaches and how to combine them effectively.",
      date: "2024-02-20",
      author: "FreeTradeJournal Team",
      category: "Analysis",
      readTime: "11 min read",
      featured: false
    },
    {
      id: 6,
      title: "Building a Profitable Trading Strategy: A Step-by-Step Guide",
      excerpt: "Learn how to develop, test, and refine trading strategies using historical data and proper backtesting techniques.",
      date: "2024-02-15",
      author: "FreeTradeJournal Team",
      category: "Strategy",
      readTime: "14 min read",
      featured: false
    }
  ];

  const categories = ["All", "Psychology", "Risk Management", "Education", "Prop Trading", "Analysis", "Strategy"];
  const featuredPosts = blogPosts.filter(post => post.featured);
  
  const filteredPosts = selectedCategory === "All" 
    ? blogPosts.filter(post => !post.featured)
    : blogPosts.filter(post => post.category === selectedCategory && !post.featured);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Handle newsletter subscription
      alert("Thank you for subscribing! We'll send you our latest trading insights.");
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-xl shadow-lg bg-primary">
                <FontAwesomeIcon icon={faBlog} className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Trading Blog</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Insights, strategies, and education for forex and futures traders. Learn from our analysis and improve your trading performance.
            </p>
          </div>

          {/* Featured Posts */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Featured Articles</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-200">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-primary">
                        {post.category}
                      </span>
                      <span className="text-sm text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <FontAwesomeIcon icon={faCalendar} className="h-4 w-4" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 ml-2" />
                        <span>{post.author}</span>
                      </div>
                      <Link 
                        to={`/blog/${post.id}`}
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-primary"
                      >
                        Read More
                        <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Browse by Category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                    category === selectedCategory 
                      ? 'bg-primary/10 text-primary border-primary' 
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {/* Recent Posts */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">
              {selectedCategory === "All" ? "Recent Articles" : `${selectedCategory} Articles`}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
 
                        }}
                      >
                        {post.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <Link 
                        to={`/blog/${post.id}`}
                        className="flex items-center gap-1 text-xs font-medium hover:text-primary transition-colors text-primary"
                      >
                        Read
                        <FontAwesomeIcon icon={faArrowRight} className="h-2 w-2" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Newsletter Signup */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">Stay Updated</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get the latest trading insights, feature updates, and educational content delivered to your inbox.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity bg-primary"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-muted-foreground">
                No spam. Unsubscribe anytime.
              </p>
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