'use client'

export default function TermsOfServicePage() {
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
            <h1 className="text-4xl font-bold mb-2 print:text-3xl">Terms of Service</h1>
            <p className="text-gray-600 print:text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none print:text-sm">
          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using the OneLP Limited Partner Portal ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily access the materials on OneLP's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on OneLP's website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">3. User Account</h2>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and identification</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept all responsibility for any activity that occurs under your account</li>
            </ul>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">4. Investment Information</h2>
            <p className="mb-4">
              The information provided through this Service is for informational purposes only and does not constitute investment advice, financial advice, trading advice, or any other sort of advice. You should not treat any such information as a recommendation to buy, sell, or hold any investment or financial product.
            </p>
            <p className="mb-4">
              All investment decisions should be made in consultation with qualified financial advisors and based on your own financial situation, investment objectives, and risk tolerance.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">5. Confidentiality</h2>
            <p className="mb-4">
              You acknowledge that all information accessible through this Service is confidential and proprietary. You agree to maintain the confidentiality of all such information and not to disclose it to any third party without prior written consent.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">6. Disclaimer</h2>
            <p className="mb-4">
              The materials on OneLP's website are provided on an 'as is' basis. OneLP makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">7. Limitations</h2>
            <p className="mb-4">
              In no event shall OneLP or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on OneLP's website, even if OneLP or a OneLP authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">8. Accuracy of Materials</h2>
            <p className="mb-4">
              The materials appearing on OneLP's website could include technical, typographical, or photographic errors. OneLP does not warrant that any of the materials on its website are accurate, complete, or current. OneLP may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">9. Links</h2>
            <p className="mb-4">
              OneLP has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by OneLP of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">10. Modifications</h2>
            <p className="mb-4">
              OneLP may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">11. Governing Law</h2>
            <p className="mb-4">
              These terms and conditions are governed by and construed in accordance with applicable laws. Any disputes relating to these terms and conditions shall be subject to the exclusive jurisdiction of the courts of the applicable jurisdiction.
            </p>
          </section>

          <section className="mb-8 print:mb-4">
            <h2 className="text-2xl font-semibold mb-4 print:text-xl">12. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us through your fund administrator or account manager.
            </p>
          </section>
        </div>

          {/* Print button */}
          <div className="mt-8 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              Print Terms of Service
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

