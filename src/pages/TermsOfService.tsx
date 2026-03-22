import Layout from "@/components/Layout";

export default function TermsOfService() {
  return (
    <Layout>
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">Terms of Service</h1>
          <p className="mb-6 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>

          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using Namso, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">2. Platform Description</h2>
              <p>Namso is a marketplace that connects small businesses with verified freelancers and recent graduates for AI-related tasks. Namso facilitates connections and provides secure payment processing but is not a party to the agreements between businesses and freelancers.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">3. User Accounts</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li>You must provide accurate and complete information when creating an account.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>Business accounts are created directly. Freelancer accounts require an application and admin approval.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">4. Payments</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li>Payments are processed securely through our platform.</li>
                <li>Funds are held in escrow until the business reviews and approves the completed work.</li>
                <li>Freelancers receive payment after work is approved by the business.</li>
                <li>Namso may charge a service fee on transactions.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">5. Task Delivery & Disputes</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li>Freelancers are expected to deliver work as described in the agreed scope.</li>
                <li>Businesses may request revisions within the agreed terms.</li>
                <li>If a dispute arises, Namso provides a fair resolution process to help both parties reach an agreement.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">6. Prohibited Conduct</h2>
              <ul className="ml-4 list-disc space-y-1">
                <li>Misrepresenting your identity, qualifications, or freelancer status.</li>
                <li>Using the platform for illegal purposes.</li>
                <li>Attempting to bypass the platform's payment system.</li>
                <li>Harassment or abusive behaviour toward other users.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
              <p>Namso acts as a marketplace facilitator. We are not liable for the quality, accuracy, or timeliness of work delivered by freelancers. Our liability is limited to the fees paid to Namso for the relevant transaction.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">8. Changes to Terms</h2>
              <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">9. Contact</h2>
              <p>Questions about these terms? Contact us at <a href="mailto:info.namsoai@gmail.com" className="text-primary hover:underline">info.namsoai@gmail.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
