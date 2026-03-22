import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Layout from "@/components/Layout";

export default function FreelancerProfile() {
  return (
    <Layout>
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Specialist Profiles Coming Soon</h1>
          <p className="mb-6 text-muted-foreground">
            We're building detailed specialist profiles so you can review expertise, portfolios, and past work before hiring.
          </p>
          <Link to="/services">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/85">Browse Services</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
