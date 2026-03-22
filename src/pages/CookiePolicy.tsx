import Layout from "@/components/Layout";

export default function CookiePolicy() {
  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">Cookie Policy</h1>
          <p className="mb-6 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">1. What Are Cookies</h2>
              <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">2. How We Use Cookies</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Essential cookies:</strong> Required for authentication and basic platform functionality. These cannot be disabled.</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences (e.g., theme).</li>
                <li><strong>Analytics cookies:</strong> Help us understand how users interact with the platform so we can improve it.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">3. Third-Party Cookies</h2>
              <p>We may use third-party services (e.g., analytics providers) that set their own cookies. These are governed by the third party's privacy policy.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">4. Managing Cookies</h2>
              <p>You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">5. Contact</h2>
              <p>Questions about our use of cookies? Contact us at <a href="mailto:info.namsoai@gmail.com" className="text-primary hover:underline">info.namsoai@gmail.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
