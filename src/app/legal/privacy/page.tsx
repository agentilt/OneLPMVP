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
            <h1 className="text-4xl font-bold mb-2 print:text-3xl">Privacy Policy</h1>
            <p className="text-gray-600 print:text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none print:text-sm">
          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">1. Introduction</h2>
            <p className="mb-4">
              OneLP ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Limited Partner Portal ("Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2 print:text-lg">2.1 Personal Information</h3>
            <p className="mb-4">
              We may collect personal information that you voluntarily provide to us when you register for the Service, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username, password)</li>
              <li>Investment and financial information related to your portfolio</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 print:text-lg">2.2 Automatically Collected Information</h3>
            <p className="mb-4">
              When you access the Service, we may automatically collect certain information about your device, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Access times and dates</li>
              <li>Pages viewed and actions taken</li>
            </ul>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your transactions and manage your account</li>
              <li>Send you administrative information, including information regarding the Service and changes to our terms, conditions, and policies</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">4. Information Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf, such as hosting, data analysis, and customer service.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction.</li>
              <li><strong>With Your Consent:</strong> We may share your information with your consent or at your direction.</li>
            </ul>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">6. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">7. Your Rights</h2>
            <p className="mb-4">Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> The right to access and receive a copy of your personal information</li>
              <li><strong>Rectification:</strong> The right to correct inaccurate or incomplete information</li>
              <li><strong>Erasure:</strong> The right to request deletion of your personal information</li>
              <li><strong>Restriction:</strong> The right to restrict processing of your personal information</li>
              <li><strong>Portability:</strong> The right to receive your personal information in a structured, commonly used format</li>
              <li><strong>Objection:</strong> The right to object to processing of your personal information</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us through your fund administrator or account manager.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">8. Cookies and Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">9. Children's Privacy</h2>
            <p className="mb-4">
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">10. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using the Service, you consent to the transfer of your information to these facilities.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">11. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">12. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us through your fund administrator or account manager.
            </p>
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

