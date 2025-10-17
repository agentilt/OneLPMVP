'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ComplianceDocument {
  id: string
  title: string
  url: string
  uploadDate: Date
  fundName: string
}

interface ComplianceClientProps {
  documents: ComplianceDocument[]
}

export function ComplianceClient({ documents }: ComplianceClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Compliance & Regulatory Updates
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-sm text-foreground/60 mt-0.5"
              >
                View compliance documents and regulatory updates for your funds
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Animated Documents List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                  className="bg-white dark:bg-slate-900 border rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                        <p className="text-sm text-foreground/60 mb-3">
                          {doc.fundName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-foreground/60">
                          <span className="px-3 py-1 bg-accent/10 text-accent rounded-full font-medium">
                            Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent to-accent-hover text-white rounded-lg hover:shadow-lg hover:shadow-accent/25 transition-all duration-300 flex-shrink-0 ml-4"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="bg-white dark:bg-slate-900 border rounded-2xl shadow-xl p-12 text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-accent" />
                </div>
                <p className="text-foreground/60 mb-2 font-medium">
                  No compliance documents available
                </p>
                <p className="text-sm text-foreground/40">
                  Check back later for compliance and regulatory updates
                </p>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

