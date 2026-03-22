import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <div className="text-center">
          <h1 className="mb-2 font-display text-6xl font-bold text-foreground">404</h1>
          <p className="mb-6 text-lg text-muted-foreground">The page you're looking for doesn't exist.</p>
          <Link to="/">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/85">Back to Home</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
