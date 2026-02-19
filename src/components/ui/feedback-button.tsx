import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FeedbackButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  className?: string;
  buttonText?: string;
}

export function FeedbackButton({ 
  variant = 'outline', 
  className = '',
  buttonText
}: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  
  // Your Tally form ID
  const TALLY_FORM_ID = 'meV7rl';

  // Load Tally script once when component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 p-4",
            "bg-primary hover:bg-primary/90",
            "text-primary-foreground rounded-full",
            "shadow-lg hover:shadow-xl hover:scale-110",
            "transition-[transform,opacity] duration-300 group",
            className
          )}
          aria-label="Send feedback"
        >
          <MessageSquare className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        </button>
        <FeedbackDialog 
          open={open} 
          onOpenChange={setOpen}
          formId={TALLY_FORM_ID}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        className={cn("gap-2 group", className)}
      >
        <MessageSquare className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
        <span>{buttonText || 'Feedback'}</span>
      </Button>
      <FeedbackDialog 
        open={open} 
        onOpenChange={setOpen}
        formId={TALLY_FORM_ID}
      />
    </>
  );
}

function FeedbackDialog({ 
  open, 
  onOpenChange,
  formId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
}) {
  const [iframeKey, setIframeKey] = useState(0);

  // Force iframe to reload when dialog opens
  useEffect(() => {
    if (open) {
      setIframeKey(prev => prev + 1);
      // Trigger Tally to process any new iframes
      if (window.Tally) {
        window.Tally.loadEmbeds();
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Share your feedback, report bugs, or request features for FreeTradeJournal
          </DialogDescription>
        </DialogHeader>
        {open && (
          <iframe
            key={iframeKey}
            data-tally-src={`https://tally.so/embed/${formId}?alignLeft=1&hideTitle=0&transparentBackground=0&dynamicHeight=1`}
            src={`https://tally.so/embed/${formId}?alignLeft=1&hideTitle=0&transparentBackground=0&dynamicHeight=1`}
            loading="lazy"
            width="100%"
            height="600"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="Feedback form"
            style={{ border: 0 }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Add TypeScript declaration for Tally
declare global {
  interface Window {
    Tally: {
      loadEmbeds: () => void;
    };
  }
}