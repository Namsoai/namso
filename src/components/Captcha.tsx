import { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";

interface CaptchaProps {
  onVerify: (token: string) => void;
}

export default function Captcha({ onVerify }: CaptchaProps) {
  const [status, setStatus] = useState<"verifying" | "verified" | "error">("verifying");

  useEffect(() => {
    // This is a placeholder for a real CAPTCHA widget (like reCAPTCHA or Turnstile)
    // You will need to install the respective library and replace this mock
    // E.g. <Turnstile siteKey="YOUR_SITE_KEY" onSuccess={onVerify} />
    
    const timer = setTimeout(() => {
      setStatus("verified");
      onVerify("mock-captcha-token-" + Date.now()); // Send a fake token to the parent form
    }, 1500);

    return () => clearTimeout(timer);
  }, [onVerify]);

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3 shadow-sm">
      {status === "verifying" && (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium text-muted-foreground">Verifying secure connection...</span>
        </>
      )}
      
      {status === "verified" && (
        <>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-foreground">Verified secure connection</span>
        </>
      )}

      {status === "error" && (
        <>
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <span className="text-sm font-medium text-destructive">Verification failed. Please try again.</span>
        </>
      )}
    </div>
  );
}
