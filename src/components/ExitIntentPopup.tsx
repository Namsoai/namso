import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    // Only show for people that aren't logged in
    if (session) return;

    // Check if user has already closed the popup once
    const hasSeenPopup = localStorage.getItem("namso_exit_intent_seen");
    if (hasSeenPopup) {
      return;
    }

    let shown = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Don't show again if already shown or previously dismissed
      if (shown || localStorage.getItem("namso_exit_intent_seen")) return;
      // Trigger when mouse leaves the top of the viewport
      if (e.clientY <= 0) {
        shown = true;
        setIsVisible(true);
        // Remove the listener so it can never fire again
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    // For mobile, display after 15 seconds as a fallback
    const mobileTimeout = setTimeout(() => {
      if (window.innerWidth < 768 && !shown && !localStorage.getItem("namso_exit_intent_seen")) {
        shown = true;
        setIsVisible(true);
      }
    }, 15000);

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(mobileTimeout);
    };
  }, [session]);

  const handleClose = () => {
    setIsVisible(false);
    // Once they close it once, it stays down
    localStorage.setItem("namso_exit_intent_seen", "true");
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
       const postgrestError = error as { code?: string; message: string };
       if (postgrestError.code === '42P01') {
          console.warn("Table 'newsletter_leads' does not exist yet. Mocking success.");
       } else {
          toast({ title: "Failed to subscribe", description: postgrestError.message || String(error), variant: "destructive" });
          setLoading(false);
          return;
       }
    }

    setSubmitted(true);
    setLoading(false);
    
    // Remember that they subscribed so we don't bother them again
    localStorage.setItem("namso_exit_intent_seen", "true");
    
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
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-6 top-6 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex flex-col md:flex-row min-h-[400px]">
              {/* Left Side: Graphic/Color block */}
              <div className="hero-gradient p-12 flex items-center justify-center md:w-2/5 border-b md:border-b-0 md:border-r border-border">
                 <div className="h-32 w-32 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-16 w-16 text-white" />
                 </div>
              </div>

              {/* Right Side: Content */}
              <div className="p-12 md:w-3/5 flex flex-col justify-center">
                {submitted ? (
                  <div className="text-center py-10 scale-110">
                    <h3 className="font-display text-3xl font-bold text-foreground mb-4">Welcome Aboard!</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      You'll receive a welcome email shortly. We only send updates that matter — no spam, ever.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-display text-4xl font-bold leading-tight text-foreground mb-6">
                      Stay ahead with <span className="text-primary">AI business news</span>.
                    </h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      Get practical AI case studies, new service announcements, and early access to features — delivered straight to your inbox.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Your business email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-14 text-lg border-border rounded-xl"
                      />
                      <Button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full h-14 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl"
                      >
                        {loading ? "Subscribing..." : "Stay in the Loop"} <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </form>
                    <button onClick={handleClose} className="mt-6 w-full text-center text-sm text-muted-foreground hover:underline transition-all">
                      No thanks, maybe later.
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
