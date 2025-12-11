'use client'

import Image from 'next/image'

export default function PlatformTermsPage() {
  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
        }
      `}</style>
      <div className="min-h-screen glass-page p-8 print:p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="glass-panel rounded-3xl border border-border shadow-xl shadow-black/15 p-6 flex items-center gap-4 print:shadow-none print:border print:border-border">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-panel shadow-xl shadow-accent/25">
              <Image src="/onelp-logo.png" alt="OneLP Logo" width={40} height={40} className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 print:text-3xl">OneLP Platform Terms of Use</h1>
              <p className="text-foreground/70 print:text-sm">Effective Date: November 5, 2025</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-border shadow-2xl shadow-black/15 p-8 print:shadow-none print:border print:border-border">
            <div className="prose prose-lg max-w-none print:text-sm prose-slate dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90">
            <section className="mb-8 print:mb-4">
              <p className="mb-4 text-foreground/90 leading-relaxed">
                  The following Terms of Use ("Agreement") govern access to and use of the OneLP software platform, services,
                  features, and tools (collectively, the "Service"). By creating an account, accessing, or using the Service, you
                  ("Client," "User," or "You") agree to be bound by this Agreement. If you do not agree, do not use the Service. Please
                  read these terms of use carefully before requesting to use these services. By accessing the site or any content on
                  the site, you agree to be bound by these terms and conditions. If you do not agree with the respective terms and
                  conditions, do not access the site, request access to the platform, or use the services or content of the site.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">1. Eligibility & Account Responsibilities</h2>
              <p className="mb-4 text-foreground/90">You represent that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>You are at least 18 years of age</li>
                <li>You are authorized to enter into this Agreement on behalf of yourself or your organization</li>
                <li>All registration information you submit is complete and accurate</li>
              </ul>
              <p className="mb-4 text-foreground/90">
                  You are responsible for maintaining the confidentiality of login credentials and all activity conducted under your account.
              </p>
                <p className="mb-4 text-foreground/90">OneLP reserves the right to suspend access for security, compliance, or misuse concerns.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">2. Nature of Service; No Advisory Role</h2>
              <p className="mb-4 text-foreground/90">
                  OneLP provides software tools for document management, data aggregation, reporting, and portfolio transparency solutions.
              </p>
              <p className="mb-4 text-foreground/90">You acknowledge that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>OneLP is not a financial adviser, broker-dealer, custodian, or fund administrator</li>
                <li>OneLP does not provide investment, legal, tax, or financial advice</li>
                <li>OneLP does not execute transactions, custody assets, or validate the truth or accuracy of third-party data</li>
              </ul>
                <p className="mb-4 text-foreground/90">All decisions based on information accessed through the Service are solely your responsibility.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">3. Client Data & Privacy</h2>
              <h3 className="text-xl font-semibold mb-2 print:text-lg text-foreground">3.1 Data Ownership</h3>
                <p className="mb-4 text-foreground/90">You retain all rights to information, documents, and data uploaded to the platform ("Client Data").</p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg text-foreground">3.2 License to Process</h3>
              <p className="mb-4 text-foreground/90">
                  You grant OneLP a limited license to host, store, process, and display Client Data solely for the purpose of providing the Service.
              </p>
              <h3 className="text-xl font-semibold mb-2 print:text-lg text-foreground">3.3 Confidentiality</h3>
              <p className="mb-4 text-foreground/90">OneLP will treat Client Data as confidential and will not access it except to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Provide support or maintenance</li>
                <li>Ensure security & system integrity</li>
                <li>Comply with law or mandatory requests</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">4. Acceptable Use</h2>
              <p className="mb-4 text-foreground/90">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Upload malicious code or attempt to breach security</li>
                <li>Use automated systems without authorization</li>
                <li>Interfere with or degrade the Service</li>
                <li>Upload data you are not legally permitted to share</li>
                <li>Resell, sublicense, or transfer access to the Service</li>
              </ul>
              <p className="mb-4 text-foreground/90">Violation may result in immediate account suspension.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">5. Subscription Fees & Billing</h2>
              <p className="mb-4 text-foreground/90">Access to the Service may require a subscription. Fees are:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Payable in accordance with plan terms</li>
                <li>Non-refundable, unless required by law</li>
                <li>Subject to change with advance notice</li>
              </ul>
              <p className="mb-4 text-foreground/90">Failure to pay may result in suspension or termination of access.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">6. Service Availability & Modifications</h2>
              <p className="mb-4 text-foreground/90">OneLP does not guarantee uninterrupted availability.</p>
              <p className="mb-4 text-foreground/90">
                  We may modify, improve, discontinue, or update functions or features at our discretion. When changes materially impact functionality, we will provide reasonable notice.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">7. Term & Termination</h2>
              <p className="mb-4 text-foreground/90">Either party may terminate with written notice.</p>
              <p className="mb-4 text-foreground/90">Upon termination:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Access to the Service ends immediately</li>
                <li>You may request export of Client Data within 30 days</li>
                <li>Sections related to confidentiality, liability, intellectual property, and governing law survive termination</li>
              </ul>
                <p className="mb-4 text-foreground/90">OneLP may suspend or terminate access immediately for misuse, security risk, or legal obligation.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">8. Intellectual Property</h2>
              <p className="mb-4 text-foreground/90">OneLP retains all rights to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Software & platform architecture</li>
                <li>Analytics, insights, and system-generated data</li>
                <li>Trade secrets, trademarks, logos, graphics, content, and proprietary systems</li>
              </ul>
              <p className="mb-4 text-foreground/90">No rights are granted except the limited right to use the Service.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">9. No Warranties</h2>
              <p className="mb-4 font-semibold text-foreground">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE."</p>
              <p className="mb-4 text-foreground/90">
                  OneLP disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and uninterrupted use.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">10. Limitation of Liability</h2>
              <p className="mb-4 text-foreground/90">
                  You will hold OneLP harmless from any liability, damage or cost (including reasonable attorney fees and cost) from any claim or demand made by a third party due to or arising out of your access to the Site, use of the Services, violation of the Terms of Use by you, or the infringement by you of any intellectual property or other right of any person or entity. To the fullest extent permitted by law:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>OneLP is not liable for indirect, incidental, consequential, punitive, or special damages</li>
              </ul>
              <p className="mb-4 text-foreground/90">You assume responsibility for any investment actions based on Service outputs.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">11. Indemnification</h2>
              <p className="mb-4 text-foreground/90">You agree to indemnify and hold harmless OneLP from claims arising out of:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Your misuse of the Service</li>
                <li>Violation of laws or third-party rights</li>
                <li>Content uploaded into the platform</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">12. Governing Law & Venue</h2>
              <p className="mb-4 text-foreground/90">
                  These Terms are governed by the laws of the jurisdiction in which OneLP is formally incorporated. Until incorporation is completed, these Terms shall be interpreted under generally accepted principles of contract law. Venue shall be a competent court of appropriate jurisdiction.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">13. Changes to Terms</h2>
              <p className="mb-4 text-foreground/90">
                  OneLP reserves the sole right to modify or replace the Terms of Use at any time. If material changes are made, OneLP will notify you by posting an announcement on the respective site. The definition of "material change" will be determined at OneLP's sole discretion, in good faith and using common sense with reasonable judgement. You are responsible for reviewing and becoming familiar with any such modifications. OneLP may update this Agreement at any time. Continued Use of the Site constitutes acceptance of modifications.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">14. Contact</h2>
              <p className="mb-4 text-foreground/90">For questions regarding these Terms:</p>
              <p className="mb-4 text-foreground/90">info@onelp.capital</p>
            </section>
            </div>
          </div>

          <div className="mt-4 print:hidden flex justify-center">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Print Terms of Use
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
