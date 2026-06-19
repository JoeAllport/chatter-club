// Privacy.jsx — Privacy Policy (/privacy)
// GDPR compliant — governing law: UK (update if Spain chosen)
// Required before any user accounts are created

import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TopNav from '../components/TopNav'
import PageMeta from '../components/PageMeta'

const LAST_UPDATED = '19 June 2026'
const CONTACT_EMAIL = 'hello@chatterclub.app'
const BRAND = 'Chatter Club'
const SITE = 'chatterclub.app'

export default function Privacy() {
  const { userId, isPro, checking } = useAuth()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageMeta
        title="Privacy Policy"
        description="How Chatter Club collects, uses and protects your personal data."
        canonical="/privacy"
      />

      <TopNav userId={userId} isPro={isPro} checking={checking} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <p className="text-xs text-gray-400 mb-2">Last updated: {LAST_UPDATED}</p>
          <h1 className="text-3xl font-bold text-gray-950 mb-3">Privacy Policy</h1>
          <p className="text-gray-500 leading-relaxed">
            This policy explains what personal data {BRAND} collects, how we use it, and your rights
            under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </div>

        <div className="prose prose-sm prose-gray max-w-none space-y-8">

          <Section title="1. Who we are">
            <p>
              {BRAND} is operated by Joe Allport ("<strong>we</strong>", "<strong>us</strong>",
              "<strong>our</strong>"). You can contact us at <a href={`mailto:${CONTACT_EMAIL}`}
              className="text-gray-900 underline">{CONTACT_EMAIL}</a>.
            </p>
            <p>
              This site is {SITE}. We are the data controller for the personal data described in
              this policy.
            </p>
          </Section>

          <Section title="2. What data we collect">
            <ul>
              <li><strong>Account data:</strong> email address, display name and learning preferences (level, goal, native language) when you sign up.</li>
              <li><strong>Learning data:</strong> your progress through courses, articles, challenges and puzzles; words saved to your word bank; quiz results and streak data.</li>
              <li><strong>Usage data:</strong> pages visited, features used, time spent — collected via Plausible Analytics (privacy-first; no cookies; no cross-site tracking).</li>
              <li><strong>Communications:</strong> any messages you send us by email.</li>
            </ul>
            <p>We do not collect payment card data. Payments are handled by Stripe, who are the data controller for that information.</p>
          </Section>

          <Section title="3. How we use your data">
            <ul>
              <li>To provide the service — save your progress, personalise your feed, track your streak.</li>
              <li>To communicate with you — account emails (sign-up confirmation, password reset). We do not send marketing emails unless you opt in.</li>
              <li>To improve the service — aggregated, anonymised analytics only.</li>
              <li>To comply with legal obligations — e.g. tax records for subscriptions.</li>
            </ul>
            <p>We rely on <strong>contract</strong> as our lawful basis for processing account and learning data. We rely on <strong>legitimate interests</strong> for analytics.</p>
          </Section>

          <Section title="4. Who we share data with">
            <p>We share data with the following processors, under written data processing agreements:</p>
            <ul>
              <li><strong>Supabase</strong> (database and authentication) — EU data centres.</li>
              <li><strong>Vercel</strong> (hosting) — EU-region deployment.</li>
              <li><strong>Stripe</strong> (payments, once live) — UK/EU compliant.</li>
              <li><strong>Plausible Analytics</strong> (usage analytics) — EU-hosted, no personal data collected.</li>
              <li><strong>Anthropic</strong> (AI writing feedback feature, once live) — data processed under DPA.</li>
            </ul>
            <p>We do not sell your data. We do not share it with advertisers.</p>
          </Section>

          <Section title="5. How long we keep your data">
            <p>
              We keep your account data for as long as your account is active. If you delete your account,
              we delete your personal data within 30 days, except where we are legally required to keep
              financial records (up to 7 years for tax purposes).
            </p>
            <p>Anonymised, aggregated learning data (e.g. "1,200 users completed this challenge") may be retained indefinitely.</p>
          </Section>

          <Section title="6. Your rights">
            <p>Under UK GDPR you have the right to:</p>
            <ul>
              <li><strong>Access</strong> the personal data we hold about you.</li>
              <li><strong>Correct</strong> inaccurate data.</li>
              <li><strong>Delete</strong> your data (the "right to be forgotten").</li>
              <li><strong>Restrict</strong> how we process your data.</li>
              <li><strong>Object</strong> to processing based on legitimate interests.</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
            </ul>
            <p>
              To exercise any of these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`}
              className="text-gray-900 underline">{CONTACT_EMAIL}</a>. We will respond within 30 days.
            </p>
            <p>
              You also have the right to complain to the Information Commissioner's Office (ICO) if you
              believe your data has been mishandled: <a href="https://ico.org.uk" target="_blank"
              rel="noopener noreferrer" className="text-gray-900 underline">ico.org.uk</a>.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use a single authentication cookie (Supabase session) to keep you logged in.
              This is essential for the service to work and does not require consent.
            </p>
            <p>
              Our analytics (Plausible) does not use cookies or track you across sites.
              We do not use advertising cookies.
            </p>
          </Section>

          <Section title="8. Children">
            <p>
              {BRAND} is designed for adults and learners aged 16 and over. We do not knowingly collect
              data from children under 16. If you believe a child has created an account, contact us
              at <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 underline">{CONTACT_EMAIL}</a> and
              we will delete the account.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We will update this policy when our practices change. Significant changes will be notified
              by email to registered users. The date at the top of this page always shows when it was
              last updated.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`}
              className="text-gray-900 underline">{CONTACT_EMAIL}</a>
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-400">
          <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
          <Link to="/" className="hover:text-gray-700 transition-colors">Back to home</Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    </section>
  )
}
