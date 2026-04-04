import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";


const mainNav = [
  { to: "/services", label: "Browse Services" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/book-call", label: "Book a Call" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, roles, signOut } = useAuth();

  const dashboardPath = roles.includes("admin")
    ? "/admin"
    : roles.includes("business")
    ? "/business"
    : "/freelancer";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSignupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex shrink-0 items-center gap-3 font-display text-3xl font-black tracking-tight text-foreground">
          <img src={logo} alt="Namso logo" className="h-14 w-14 rounded-lg" />
          Namso
        </Link>

        {/* Desktop right — nav links + auth */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {mainNav.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                location.pathname === link.to ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}



          {user ? (
            <div className="ml-3 flex items-center gap-2">
              <Link to={dashboardPath}>
                <Button size="sm" variant="outline">Dashboard</Button>
              </Link>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={signOut}>
                Log Out
              </Button>
            </div>
          ) : (
            <div className="ml-3 flex items-center gap-2">

              <Link to="/login">
                <Button className="rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md transition-all">
                  Log In
                </Button>
              </Link>
              <div className="relative" ref={dropdownRef}>
                <Button
                  className="rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md transition-all"
                  onClick={() => setSignupOpen(!signupOpen)}
                >
                  Sign Up <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
                {signupOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                    <Link
                      to="/signup/freelancer"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      onClick={() => setSignupOpen(false)}
                    >
                      Join as Specialist
                    </Link>
                    <Link
                      to="/signup/business"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      onClick={() => setSignupOpen(false)}
                    >
                      Join as Business
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 md:hidden">

          {mainNav.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">Dashboard</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="sm">Log In</Button>
                </Link>
                <Link to="/signup/freelancer" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full border-primary text-primary" size="sm">Join as Specialist</Button>
                </Link>
                <Link to="/signup/business" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full border-primary text-primary" size="sm">Join as Business</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-display text-lg font-bold">Namso</div>
            <p className="mt-3 text-sm text-primary-foreground/70">
              The AI freelance marketplace connecting businesses with verified integration specialists.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-primary-foreground/50">
              <Shield className="h-3 w-3" />
              Secure payments · Verified specialists
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">For Businesses</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/services" className="transition-colors hover:text-primary-foreground">Browse Services</Link>
              <Link to="/signup/business" className="transition-colors hover:text-primary-foreground">Join as Business</Link>
              <Link to="/how-it-works" className="transition-colors hover:text-primary-foreground">How It Works</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">Company</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/about" className="transition-colors hover:text-primary-foreground">About Namso</Link>
              <Link to="/faq" className="transition-colors hover:text-primary-foreground">FAQ</Link>
              <Link to="/contact" className="transition-colors hover:text-primary-foreground">Contact Us</Link>
              <Link to="/signup/freelancer" className="transition-colors hover:text-primary-foreground">Join as a Specialist</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">Legal & Support</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/privacy" className="transition-colors hover:text-primary-foreground">Privacy Policy</Link>
              <Link to="/terms" className="transition-colors hover:text-primary-foreground">Terms of Service</Link>
              <Link to="/cookies" className="transition-colors hover:text-primary-foreground">Cookie Policy</Link>
              <Link to="/refund-policy" className="transition-colors hover:text-primary-foreground">Refund & Resolution Policy</Link>
              <a href="mailto:info.namsoai@gmail.com" className="transition-colors hover:text-primary-foreground">info.namsoai@gmail.com</a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} Namso. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
