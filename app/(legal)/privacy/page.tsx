export default function PrivacyPage() {
  return (
    <article className="prose prose-zinc max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-zinc-500 text-sm">Last updated November 15, 2026</p>

      <h2>1. What we collect</h2>
      <p>
        When a customer scans a QR code we collect the IP address, the generated
        review draft, and the timestamp. We do not collect names or email addresses
        from customers unless they provide them voluntarily.
      </p>
      <p>
        When you create a business account we collect your name, email address, and
        business name. Payment information is processed by our payment provider and
        is not stored on our servers.
      </p>

      <h2>2. How we use it</h2>
      <p>
        We use collected data to operate the service, enforce rate limits, improve
        review generation quality, and communicate with you about your account. We
        do not sell personal data to third parties.
      </p>

      <h2>3. Cookies</h2>
      <p>
        We use a single session cookie to keep you signed in. We do not use
        advertising or tracking cookies.
      </p>

      <h2>4. Data retention</h2>
      <p>
        Session data is retained for 30 days. Account data is kept as long as your
        account is active and for a reasonable period afterwards. You can request
        deletion of your data at any time by contacting us.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        The service integrates with Google Reviews. When a customer follows a
        handoff link, Google&apos;s own privacy policy applies. We use a payment
        processor to handle transactions; their privacy policy governs that data.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data
        at any time. Reach us through the contact section on the home page.
      </p>

      <h2>7. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        communicated via a notice on the site. Continued use of the service
        constitutes acceptance.
      </p>
    </article>
  );
}
