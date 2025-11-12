'use client'

export default function PrivacyPolicyPage() {
  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
        }
      `}</style>
      <div className="min-h-screen bg-white p-8 print:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 print:mb-4">
            <h1 className="text-4xl font-bold mb-2 print:text-3xl">OneLP Privacy Policy</h1>
            <p className="text-gray-600 print:text-sm">
              Effective Date: November 5, 2025
            </p>
            <p className="text-gray-600 print:text-sm">
              Last Updated: November 5, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none print:text-sm">
            <section className="mb-8 print:mb-4">
              <p className="mb-4">
                This Privacy Policy explains how OneLP ("Company," "we," "us," or "our") collects, uses, processes, and protects personal data when you visit our website or use the OneLP platform ("Service"). This policy outlines the measures we take to monitor, safeguard, and secure personal information.
              </p>
              <p className="mb-4">
                If you do not agree with this Privacy Policy, please discontinue use of the Site and the Service.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">1. Scope of This Policy</h2>
              <p className="mb-4">This Privacy Policy applies to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Visitors to the OneLP website (www.onelp.capital)</li>
                <li>Users who create accounts on the OneLP platform</li>
                <li>Clients who upload documents or data</li>
                <li>Communications, inquiries, and interactions with OneLP</li>
              </ul>
              <p className="mb-4">This Policy does not apply to third-party websites or external providers linked from our Site.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">2. Information We Collect</h2>
              <p className="mb-4">We collect information in the following categories:</p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Name, email address, and contact details</li>
                <li>Organization or firm information</li>
                <li>Account login credentials</li>
                <li>Uploaded documents (e.g., fund docs, PDFs, Excel files)</li>
                <li>Investment-related metadata (e.g., position names, file tags, categorization)</li>
                <li>Support requests or messages</li>
              </ul>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">2.2 Information Collected Automatically</h3>
              <p className="mb-4">When you visit the Site or use the Platform, we automatically collect:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Device information: IP address, browser, operating system</li>
                <li>Usage logs: pages viewed, timestamps, actions taken</li>
                <li>System event logs (e.g., login attempts, MFA verification, password resets)</li>
                <li>Cookie and tracking data</li>
              </ul>
              <p className="mb-4">For platform users, we additionally log:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Account activity</li>
                <li>Upload, download, and access operations</li>
                <li>Session metadata for security (IP, device, timestamp)</li>
              </ul>
              <p className="mb-4">
                These logs support security monitoring, audit trails, and fraud prevention in order to keep the platform secure and maintain a strong information security posture.
              </p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">2.3 Information from Third-Party Services</h3>
              <p className="mb-4">We may receive data from:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Identity verification providers</li>
                <li>Analytics providers (aggregated, non-identifying)</li>
                <li>Cloud infrastructure providers (operational metadata only)</li>
              </ul>
              <p className="mb-4">We do not purchase third-party data about you.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">3. How We Use Your Information</h2>
              <p className="mb-4">We use personal data for:</p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">3.1 Providing the OneLP Service</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Account creation and authentication</li>
                <li>Document storage and retrieval</li>
                <li>Portfolio tracking, visualization, and reporting</li>
                <li>Client support and communication</li>
              </ul>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">3.2 Security & Fraud Prevention</h3>
              <p className="mb-4">We implement multi-layered information security measures, including:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Multi-factor authentication (MFA)</li>
                <li>Strong password hashing</li>
                <li>Rate limiting and login monitoring</li>
                <li>Audit logging of sensitive operations</li>
                <li>Encrypted connections and secure session management</li>
              </ul>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">3.3 Improving the Platform</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Product analytics (aggregated)</li>
                <li>Performance monitoring</li>
                <li>Error diagnostics</li>
              </ul>
              <p className="mb-4">We do not use Client Data for training AI models without explicit permission.</p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">3.4 Legal & Compliance</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Detecting misuse or violation of terms</li>
                <li>Responding to legal obligations and regulatory inquiries</li>
                <li>Tax and invoicing requirements (for paid plans)</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">4. Legal Basis for Processing (GDPR)</h2>
              <p className="mb-4">We process personal data under the following legal bases:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Contractual Necessity:</strong> to provide the Service to you</li>
                <li><strong>Legitimate Interests:</strong> platform security, fraud detection, product improvement</li>
                <li><strong>Legal Obligation:</strong> compliance with applicable laws</li>
                <li><strong>Consent:</strong> marketing communications, cookies</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">5. How We Protect Your Data</h2>
              <p className="mb-4">We use industry-standard, enterprise-grade security controls, including:</p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">5.1 Encryption</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>In Transit: TLS 1.2+ enforced end-to-end</li>
                <li>At Rest: all databases use encrypted storage</li>
              </ul>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">5.2 Infrastructure Security</h3>
              <p className="mb-4">We operate on a secure cloud stack that includes:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Cloudflare DDoS protection & Web Application Firewall (WAF)</li>
                <li>Hardened serverless architecture (Vercel) with isolated execution environments</li>
                <li>Secure database infrastructure with access controls and encrypted connections</li>
              </ul>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">5.3 Application Security</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>MFA and strong password policies</li>
                <li>Role-based access control (RBAC)</li>
                <li>Input validation and SQL injection prevention</li>
                <li>Security headers (HSTS, CSP, XSS protection, etc.)</li>
                <li>Automated monitoring for suspicious activity</li>
              </ul>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">5.4 Audit & Logging</h3>
              <p className="mb-4">Our system maintains audit logs for actions including:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Logins, password changes, MFA attempts</li>
                <li>Document uploads, downloads, and deletions</li>
                <li>Access grants and revocations</li>
              </ul>
              <p className="mb-4">These logs are used solely for security, compliance, and fraud detection.</p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">5.5 Incident Response</h3>
              <p className="mb-4">We maintain an internal incident response plan including:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Immediate secret rotation</li>
                <li>Session revocation</li>
                <li>Notifications to affected users (as required by law)</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">6. Data Sharing</h2>
              <p className="mb-4">We do not sell or rent personal data.</p>
              <p className="mb-4">We only share data with:</p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">6.1 Service Providers (Processors)</h3>
              <p className="mb-4">These include:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Cloud infrastructure providers</li>
                <li>Database hosting services</li>
                <li>Email service providers</li>
                <li>Analytics providers (non-identifying)</li>
                <li>Customer support tools</li>
              </ul>
              <p className="mb-4">All providers are contractually obligated to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Use data only to provide services to OneLP</li>
                <li>Maintain confidentiality and security</li>
                <li>Comply with GDPR when applicable</li>
              </ul>
              <h3 className="text-xl font-semibold mb-2 print:text-lg">6.2 Legal Requests</h3>
              <p className="mb-4">We may disclose information if required to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Comply with law, subpoena, or court order</li>
                <li>Protect safety, security, or fraud investigations</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">7. Data Retention</h2>
              <p className="mb-4">We retain:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Account data: until you delete your account</li>
                <li>Platform logs: typically 90–180 days</li>
                <li>Documents: until removed by the user</li>
                <li>Billing records: as legally required</li>
              </ul>
              <p className="mb-4">You may request deletion at any time (see Section 9).</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">8. Your Rights</h2>
              <p className="mb-4">Under GDPR, CCPA, and similar laws, users may:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Delete personal data</li>
                <li>Restrict or object to processing</li>
                <li>Export data (portability)</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mb-4">Requests can be made at: info@onelp.capital</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">9. Children's Privacy</h2>
              <p className="mb-4">The Service is not intended for individuals under 18.</p>
              <p className="mb-4">We do not knowingly collect data from minors.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">10. Data Ownership</h2>
              <p className="mb-4">You retain all ownership rights to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Uploaded documents</li>
                <li>Investment metadata</li>
                <li>Client Data</li>
              </ul>
              <p className="mb-4">OneLP processes such data only to provide the Service.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">11. Data Breach Notification</h2>
              <p className="mb-4">If a breach occurs that affects your data:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>You will be notified without undue delay</li>
                <li>We will provide details on scope, impact, and remediation</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">12. Changes to This Privacy Policy</h2>
              <p className="mb-4">We may update this Policy periodically.</p>
              <p className="mb-4">If changes are material, we will notify users via:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Email</li>
                <li>Platform alerts</li>
                <li>Updated "Last Updated" date</li>
              </ul>
              <p className="mb-4">Continued use of the Service constitutes acceptance of updated terms.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl">13. Contact Information</h2>
              <p className="mb-4">For privacy questions or data requests:</p>
              <p className="mb-4">info@onelp.capital</p>
            </section>
          </div>

          {/* Print button */}
          <div className="mt-8 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              Print Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
