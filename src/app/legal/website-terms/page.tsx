'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function WebsiteTermsPage() {
  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 print:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Logo and Header */}
          <div className="mb-8 print:mb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 shadow-xl shadow-accent/30">
                <Image
                  src="/onelp-logo.png"
                  alt="OneLP Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 print:text-3xl">OneLP Website Terms & Conditions</h1>
                <p className="text-foreground/70 print:text-sm">
                  Last Updated: November 5, 2025
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 print:shadow-none print:border-0">
            <div className="prose prose-lg max-w-none print:text-sm prose-slate dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90">
            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">Acceptance of Terms</h2>
              <p className="mb-4 text-foreground/90">
                Welcome to OneLP ("Company", "we", "us", "our"). By accessing this website (the "Site"), creating an
                account as a prospective client, or acquire services via the site, you agree to the terms of use outlined in
                this policy and to be bound by these Terms & Conditions ("Terms"). If you do not agree, discontinue use
                immediately.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">1. Permitted Use</h2>
              <p className="mb-4 text-foreground/90">You agree to use the Site solely for lawful purposes. You shall not:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Access or attempt to access secure or private areas without authorization</li>
                <li>Introduce malware, automated scraping tools, bots, crawlers, or any technology that represents or indicates malicious activity</li>
                <li>Reverse engineer the site or interfere with site functionality</li>
                <li>Copy, reproduce, or redistribute website content without written consent</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">2. Intellectual Property</h2>
              <p className="mb-4 text-foreground/90">
                The Site and all related content (text, software, graphics, logos, trademarks, data compilations, and
                code) are the exclusive property of OneLP or its licensors. No rights are granted except those expressly
                stated as such.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">3. No Investment Advice</h2>
              <p className="mb-4 text-foreground/90">Content on this Site is for informational purposes only and does not constitute:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Financial or investment advice</li>
                <li>Legal or tax advice</li>
                <li>Securities solicitation or recommendations</li>
              </ul>
              <p className="mb-4 text-foreground/90">Users should consult qualified professionals before making financial decisions.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">4. Disclaimer</h2>
              <p className="mb-4 text-foreground/90">
                OneLP strives to present accurate, timely, and complete information on the website. Diligent care has
                been put into the retrieval of all information that is represented on the respective site. However, OneLP
                does not guarantee that all information represented on the website is accurate, timely, and complete.
              </p>
              <p className="mb-4 font-semibold text-foreground">
                THE WEB SITE (INCLUDING ALL INFORMATION AND MATERIALS CONTAINED ON THE WEB SITE) IS
                PROVIDED "AS IS" "AS AVAILABLE." ONELP IS NOT PROVIDING ANY WARRANTIES AND
                REPRESENTATIONS REGARDING THE WEB SITE. ONELP DISCLAIMS ALL WARRANTIES AND
                REPRESENTATIONS OF ANY KIND WITH REGARD TO THE WEB SITE, INCLUDING ANY IMPLIED
                WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT OF THIRD-PARTY RIGHTS, FREEDOM FROM
                VIRUSES OR OTHER HARMFUL CODE, OR FITNESS FOR A PARTICULAR PURPOSE. ONELP DOES NOT
                WARRANT THE ACCURACY, ADEQUACY, OR COMPLETENESS OF THE INFORMATION AND MATERIALS
                CONTAINED ON THE WEB SITE AND EXPRESSLY DISCLAIMS LIABILITY FOR ERRORS OR OMISSIONS IN THE
                MATERIALS AND INFORMATION.
              </p>
              <p className="mb-4 text-foreground/90">You rely on the Site at your own risk.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">5. Third-Party Links</h2>
              <p className="mb-4 text-foreground/90">
                The Site may contain links to third-party websites. We do not endorse and are not responsible for third-
                party content or policies therein accessed using the respective links.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">6. Indemnification</h2>
              <p className="mb-4 text-foreground/90">You agree to indemnify and hold OneLP harmless from any losses or claims arising out of:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90">
                <li>Your use of the Site</li>
                <li>Violation of these Terms & Conditions</li>
                <li>Violation of laws, regulations, or third-party rights</li>
              </ul>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">7. Limitation of Liability</h2>
              <p className="mb-4 text-foreground/90">
                To the fullest extent permitted by law, we disclaim liability for any direct, indirect, incidental,
                consequential, punitive, or special damages arising from your use of the Site.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">8. Disclaimer of Warranties</h2>
              <p className="mb-4 text-foreground/90">The Site is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.</p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">9. Governing Law</h2>
              <p className="mb-4 text-foreground/90">
                These Terms will be governed by the laws of the jurisdiction in which OneLP is legally incorporated, once
                established. Prior to formal incorporation, these Terms shall be interpreted in accordance with generally
                accepted principles of contract law. Any disputes arising out of these Terms shall be brought in a
                competent court of appropriate jurisdiction.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">10. Termination</h2>
              <p className="mb-4 text-foreground/90">
                OneLP holds the right to suspend or terminate access to the Site for any reason at any time without
                notice to modify, update, discontinue, replace, or terminate the website with or without prior written
                verbal consent or written notice. OneLP shall not bear responsibility for the failure to store or delete
                information generated by the platform or by users.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">11. Modifications of Terms & Conditions</h2>
              <p className="mb-4 text-foreground/90">
                OneLP shall retain the right to update or modify these Terms & Conditions at any time, without any
                express notice. If the modifications contain a materially meaningful change to the Terms & Conditions,
                OneLP will notify users by posting an update on the respective Site. Further, OneLP holds the right and
                discretion to define what a "material change" represents and will use reasonable judgement to make
                this determination. Continued use of the site following the notification of modifications constitutes your
                acceptance of the Terms & Conditions as modified.
              </p>
            </section>

            <section className="mb-8 print:mb-4">
              <h2 className="text-2xl font-semibold mb-4 print:text-xl text-foreground">Contact</h2>
              <p className="mb-4 text-foreground/90">For questions: info@onelp.capital</p>
            </section>
          </div>

          {/* Print button */}
          <div className="mt-8 print:hidden flex justify-center">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-gradient-to-r from-accent to-accent/90 hover:from-accent-hover hover:to-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Print Terms & Conditions
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

