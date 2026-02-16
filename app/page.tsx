import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-box flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-content"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <span className="font-semibold text-lg">Questionnaire Audit</span>
            </div>
            <Link href="/signin" className="btn btn-primary btn-sm">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Streamline Questionnaire Reviews
            </h1>
            <p className="text-xl text-base-content/70 mb-8 max-w-2xl mx-auto">
              A simple tool for trust clients to review questions and submit suggestions.
              No accounts needed - just share a link.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload Master Questionnaire
              </Link>
              <Link href="/dashboard" className="btn btn-outline btn-lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Single Project (Legacy)
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 bg-base-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload CSV</h3>
                <p className="text-base-content/60">
                  Upload your questionnaire as a CSV file with questions, categories,
                  and answer options.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-secondary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Share Link</h3>
                <p className="text-base-content/60">
                  Get a unique review link to share with trust users. No accounts
                  or logins required.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="font-semibold mb-2">Collect Feedback</h3>
                <p className="text-base-content/60">
                  Trust users can view questions and submit suggestions. Manage
                  feedback from your admin dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="bg-base-100 rounded-box border border-base-300 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-success/10 rounded-box flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-success"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">No Login Required</h3>
                    <p className="text-sm text-base-content/60">
                      Trust users can submit suggestions without creating accounts.
                      Just share the link and they&apos;re ready to go.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-base-100 rounded-box border border-base-300 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-info/10 rounded-box flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-info"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Collaborative Visibility</h3>
                    <p className="text-sm text-base-content/60">
                      Team members can see each other&apos;s suggestions to avoid
                      duplicates and build on ideas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-base-100 rounded-box border border-base-300 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-warning/10 rounded-box flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-warning"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Status Tracking</h3>
                    <p className="text-sm text-base-content/60">
                      Track suggestions as Pending, Approved, or Rejected. Users
                      can see the status of their submissions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-base-100 rounded-box border border-base-300 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-box flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Response Messages</h3>
                    <p className="text-sm text-base-content/60">
                      Account managers can add responses to suggestions that are
                      visible to the submitters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-base-100">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-base-content/60 mb-6">
              Upload your master questionnaire and share instances with multiple trusts.
            </p>
            <Link href="/dashboard" className="btn btn-primary">
              Upload Master Questionnaire
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-base-100 border-t border-base-300 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-base-content/60">
          <p>Questionnaire Audit Tool</p>
        </div>
      </footer>
    </div>
  );
}
