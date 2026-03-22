import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has already seen/closed the popup recently
    const hasSeenPopup = localStorage.getItem("namso_exit_intent_seen");
    if (hasSeenPopup) {
      const seenAt = new Date(hasSeenPopup).getTime();
      const now = new Date().getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      // If they saw it less than 7 days ago, don't show it
      if (now - seenAt < sevenDays) {
        return;
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse leaves the top of the viewport
      if (e.clientY <= 0) {
        setIsVisible(true);
      }
    };

    // For mobile, display after 15 seconds as a fallback
    const mobileTimeout = setTimeout(() => {
      if (window.innerWidth < 768) {
        setIsVisible(true);
      }
    }, 15000);

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(mobileTimeout);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("namso_exit_intent_seen", new Date().toISOString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setLoading(true);

    const { error } = await (supabase.from("newsletter_leads" as never) as unknown as { insert: (data: unknown) => Promise<{ error: unknown }> }).insert({
      email,
      source: "exit_intent",
    });

    if (error) {
       // Graceful fallback if table doesn't exist for demo purposes
       if (error.code === '42P01') {
          console.warn("Table 'newsletter_leads' does not exist yet. Mocking success.");
       } else {
          toast({ title: "Failed to subscribe", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
          setLoading(false);
          return;
       }
    }

    setSubmitted(true);
    setLoading(false);
    
    // Remember that they subscribed so we don't bother them again
    localStorage.setItem("namso_exit_intent_seen", new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());
    
    setTimeout(() => setIsVisible(false), 3000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Left Side: Graphic/Color block */}
              <div className="bg-primary/10 p-8 flex items-center justify-center md:w-2/5">
                 <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mix-blend-multiply">
                    <Sparkles className="h-10 w-10 text-primary" />
                 </div>
              </div>

              {/* Right Side: Content */}
              <div className="p-8 md:w-3/5">
                {submitted ? (
                  <div className="text-center py-6">
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">You're Set!</h3>
                    <p className="text-muted-foreground text-sm">
                      Check your inbox shortly for your exclusive business discount and AI insights.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-display text-2xl font-bold leading-tight text-foreground mb-3">
                      Wait! Don't miss out on <span className="text-primary">20% off</span> your first AI project.
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Join our newsletter to get access to verified AI specialists, exclusive discounts, and automation guides.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <Input
                        type="email"
                        placeholder="Work email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 border-border"
                      />
                      <Button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {loading ? "Claiming..." : "Claim My Discount"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                    <button onClick={handleClose} className="mt-4 w-full text-center text-xs text-muted-foreground hover:underline">
                      No thanks, I don't want to optimize my workflows.
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
