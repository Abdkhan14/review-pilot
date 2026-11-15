export default function PrivacyPage() {
  return (
    <article className="prose prose-zinc max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-zinc-500 text-sm">[Effective date: TBD]</p>

      <h2>1. What we collect</h2>
      <p>
        [When a customer scans a QR code we collect the IP address, the generated
        review draft, and the timestamp. We do not collect names or email addresses
        from customers unless they provide them voluntarily.]
      </p>

      <h2>2. How we use it</h2>
      <p>
        [We use collected data to operate the service, enforce rate limits, and
        improve review generation quality. We do not sell personal data.]
      </p>

      <h2>3. Data retention</h2>
      <p>
        [Session data is retained for 30 days. Anonymised aggregate statistics may
        be kept indefinitely.]
      </p>

      <h2>4. Third-party services</h2>
      <p>
        [The service integrates with Google reviews. When a customer follows a
        handoff link, Google&apos;s own privacy policy applies.]
      </p>

      <h2>5. Your rights</h2>
      <p>
        [You may request deletion of your data at any time by contacting us. See
        the contact section on the home page.]
      </p>

      <p className="text-zinc-400 text-sm mt-8">[Contact: see the contact section on the home page.]</p>
    </article>
  );
}
