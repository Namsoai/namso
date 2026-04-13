import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Shield, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, roles, signOut } = useAuth();

  const mainNav = [
    { to: "/services", label: t('nav.solutions') },
    { to: "/how-it-works", label: t('nav.howItWorks') },
    { to: "/book-call", label: t('nav.bookCall') },
  ];

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

          {/* Language toggle */}
          <div className="flex items-center gap-0.5 text-sm font-medium ml-1">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`rounded px-1.5 py-1 transition-colors ${
                i18n.language === 'en' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
            <span className="text-border">|</span>
            <button
              onClick={() => i18n.changeLanguage('nl')}
              className={`rounded px-1.5 py-1 transition-colors ${
                i18n.language === 'nl' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              NL
            </button>
          </div>

          {user ? (
            <div className="ml-3 flex items-center gap-2">
              <Link to={dashboardPath}>
                <Button size="sm" variant="outline">{t('nav.dashboard')}</Button>
              </Link>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={signOut}>
                {t('nav.logOut')}
              </Button>
            </div>
          ) : (
            <div className="ml-3 flex items-center gap-2">
              <Link to="/login">
                <Button>
                  {t('nav.logIn')}
                </Button>
              </Link>
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={() => setSignupOpen(!signupOpen)}
                >
                  {t('nav.signUp')} <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
                {signupOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                    <Link
                      to="/signup/freelancer"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      onClick={() => setSignupOpen(false)}
                    >
                      {t('nav.joinBuilder')}
                    </Link>
                    <Link
                      to="/signup/business"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      onClick={() => setSignupOpen(false)}
                    >
                      {t('nav.joinBusiness')}
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
          {/* Mobile language toggle */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
                i18n.language === 'en' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
            <span className="text-border text-sm">|</span>
            <button
              onClick={() => i18n.changeLanguage('nl')}
              className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
                i18n.language === 'nl' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              NL
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">{t('nav.dashboard')}</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" onClick={() => { signOut(); setMobileOpen(false); }}>
                  {t('nav.logOut')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" size="sm">{t('nav.logIn')}</Button>
                </Link>
                <Link to="/signup/freelancer" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">{t('nav.joinBuilder')}</Button>
                </Link>
                <Link to="/signup/business" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">{t('nav.joinBusiness')}</Button>
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
  const { t, i18n } = useTranslation();

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-display text-lg font-bold">Namso</div>
            <p className="mt-3 text-sm text-primary-foreground/70">
              {t('footer.description')}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-primary-foreground/50">
              <Shield className="h-3 w-3" />
              {t('footer.secure')}
            </div>
            

          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t('footer.forBusinesses')}</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/services" className="transition-colors hover:text-primary-foreground">{t('nav.browseServices')}</Link>
              <Link to="/signup/business" className="transition-colors hover:text-primary-foreground">{t('nav.joinBusiness')}</Link>
              <Link to="/how-it-works" className="transition-colors hover:text-primary-foreground">{t('nav.howItWorks')}</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t('footer.company')}</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/about" className="transition-colors hover:text-primary-foreground">{t('footer.aboutNamso')}</Link>
              <Link to="/faq" className="transition-colors hover:text-primary-foreground">{t('footer.faq')}</Link>
              <Link to="/contact" className="transition-colors hover:text-primary-foreground">{t('footer.contactUs')}</Link>
              <Link to="/signup/freelancer" className="transition-colors hover:text-primary-foreground">{t('footer.joinBuilder')}</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">{t('footer.legalSupport')}</h4>
            <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <Link to="/privacy" className="transition-colors hover:text-primary-foreground">{t('footer.privacyPolicy')}</Link>
              <Link to="/terms" className="transition-colors hover:text-primary-foreground">{t('footer.termsOfService')}</Link>
              <Link to="/cookies" className="transition-colors hover:text-primary-foreground">{t('footer.cookiePolicy')}</Link>
              <Link to="/refund-policy" className="transition-colors hover:text-primary-foreground">{t('footer.refundPolicy')}</Link>
              <a href="mailto:hello@namso.ai" className="transition-colors hover:text-primary-foreground">hello@namso.ai</a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/20 pt-6 flex justify-between items-center text-sm text-primary-foreground/50">
          <div>© {new Date().getFullYear()} Namso. {t('footer.allRightsReserved')}</div>
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
