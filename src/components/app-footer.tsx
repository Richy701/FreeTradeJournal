import { Link } from 'react-router-dom';
import { FeedbackButton } from '@/components/ui/feedback-button';

export function AppFooter() {
  return (
    <footer className="border-t border-border/50 mt-8 py-6 px-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">
          &copy; {new Date().getFullYear()} FreeTradeJournal
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <FeedbackButton
            variant="ghost"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-normal"
            buttonText="Feedback"
          />
        </div>
      </div>
    </footer>
  );
}
