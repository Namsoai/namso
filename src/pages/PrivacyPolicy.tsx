import Layout from "@/components/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">Privacy Policy</h1>
          <p className="mb-6 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">1. Introduction</h2>
              <p>Namso ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our platform.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">2. Information We Collect</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Account information:</strong> Name, email address, university details (for freelancers), and business name (for businesses).</li>
                <li><strong>Profile information:</strong> Username, avatar, bio, skills, and tools.</li>
                <li><strong>Usage data:</strong> Pages visited, features used, and interaction patterns.</li>
                <li><strong>Communications:</strong> Messages sent through the platform and contact form submissions.</li>
                <li><strong>Payment information:</strong> Payment details are processed securely by our payment provider and are not stored on our servers.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li>To create and manage your account.</li>
                <li>To match businesses with suitable freelancer talent.</li>
                <li>To process payments securely.</li>
                <li>To communicate with you about your account, tasks, and platform updates.</li>
                <li>To improve our platform and services.</li>
                <li>To prevent fraud and ensure platform security.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">4. Data Sharing</h2>
              <p>We do not sell your personal data. We may share information with:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Other users as necessary to facilitate tasks (e.g., sharing your business name with a freelancer you hire).</li>
                <li>Service providers who help us operate the platform (e.g., payment processing, hosting).</li>
                <li>Law enforcement if required by law.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">5. Data Security</h2>
              <p>We use industry-standard security measures including encryption, secure authentication, and access controls to protect your data.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">6. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal data. You can update your profile information in Account Settings or contact us at <a href="mailto:info.namsoai@gmail.com" className="text-primary hover:underline">info.namsoai@gmail.com</a> for assistance.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">7. Contact</h2>
              <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:info.namsoai@gmail.com" className="text-primary hover:underline">info.namsoai@gmail.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
