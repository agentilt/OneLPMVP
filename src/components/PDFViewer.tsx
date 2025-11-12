'use client'

import { useState, useEffect } from 'react'
import { Download, ExternalLink, FileText, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { useActivityTracker } from '@/hooks/useActivityTracker'

interface PDFViewerProps {
  url: string
  title: string
  documentId?: string // Optional: if provided, use secure proxy
  documentType?: 'fund' | 'direct-investment' // Optional: specify document type for proxy routing
  onClose?: () => void
}

export function PDFViewer({ url, title, documentId, documentType, onClose }: PDFViewerProps) {
  const { trackDocumentView, trackDownload } = useActivityTracker()
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pdfError, setPdfError] = useState(false)
  const [isImage, setIsImage] = useState<boolean | null>(null)

  // Use secure proxy URL if documentId is provided
  // If documentType is 'direct-investment', use that proxy endpoint
  // Otherwise default to fund documents proxy
  const pdfUrl = documentId 
    ? documentType === 'direct-investment'
      ? `/api/direct-investment-documents/${documentId}/proxy`
      : `/api/documents/${documentId}/proxy`
    : url

  useEffect(() => {
    // Track document view when PDFViewer opens
    if (documentId) {
      trackDocumentView(documentId, documentType || 'fund', {
        title,
        documentType,
        action: 'view_pdf_viewer'
      })
    }

    // Reset error state when URL changes
    setPdfError(false)
    setIsImage(null)
    console.log('[PDFViewer] Loading document from URL:', pdfUrl, 'documentId:', documentId, 'documentType:', documentType)
    
    // Check Content-Type to determine if it's an image
    if (pdfUrl && documentId) {
      fetch(pdfUrl, { method: 'HEAD' })
        .then(response => {
          const contentType = response.headers.get('content-type') || ''
          const isImageContent = contentType.startsWith('image/')
          setIsImage(isImageContent)
          console.log('[PDFViewer] Detected content-type:', contentType, 'isImage:', isImageContent)
        })
        .catch(() => {
          // If HEAD fails, try to detect from URL extension as fallback
          setIsImage(pdfUrl.includes('.png') || pdfUrl.includes('.jpg') || pdfUrl.includes('.jpeg'))
        })
    }
  }, [pdfUrl, documentId, documentType, title, trackDocumentView])

  const handleDownload = () => {
    if (documentId) {
      trackDownload(documentId, documentType === 'direct-investment' ? 'DIRECT_INVESTMENT_DOCUMENT' : 'DOCUMENT', {
        title,
        documentType
      })
    }
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleIframeError = () => {
    console.log('Iframe failed to load PDF, showing fallback')
    setPdfError(true)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-lg truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            
            {/* Rotate Button */}
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>

            {/* External Link Button */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground rounded-lg font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </a>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* PDF/Image Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800 p-4">
          <div 
            className="mx-auto bg-white dark:bg-slate-900 shadow-lg rounded-lg overflow-hidden"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center top',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            {!pdfError ? (
              // Check if content is an image (based on Content-Type or fallback to URL)
              (isImage === true || (isImage === null && (pdfUrl.includes('.png') || pdfUrl.includes('.jpg') || pdfUrl.includes('.jpeg')))) ? (
                <div className="w-full flex items-center justify-center p-4">
                  <img
                    src={pdfUrl}
                    alt={title}
                    className="max-w-full max-h-[800px] object-contain"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                    }}
                    onError={() => {
                      console.log('[PDFViewer] Image failed to load, trying as PDF')
                      setIsImage(false)
                      setPdfError(false) // Reset error to try iframe
                    }}
                    onLoad={() => {
                      console.log('[PDFViewer] Image loaded successfully')
                    }}
                  />
                </div>
              ) : (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-[800px] border-0"
                  title={title}
                  onError={handleIframeError}
                  onLoad={() => {
                    // Check if iframe loaded successfully
                    setTimeout(() => {
                      try {
                        const iframe = document.querySelector('iframe')
                        if (iframe && iframe.contentDocument === null) {
                          // If iframe fails, try loading as image
                          if (isImage === null) {
                            console.log('[PDFViewer] Iframe failed, trying as image')
                            setIsImage(true)
                            setPdfError(false)
                          } else {
                            handleIframeError()
                          }
                        }
                      } catch (e) {
                        handleIframeError()
                      }
                    }, 2000)
                  }}
                />
              )
            ) : (
              <div className="p-8 text-center h-[800px] flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-foreground/40" />
                <p className="text-lg font-semibold mb-2">Document Preview Not Available</p>
                <p className="text-foreground/60 mb-6 max-w-md">
                  Document preview is not supported in this environment. You can still download the document or open it in a new tab.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground rounded-xl font-semibold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-foreground/60">
            <div className="flex items-center gap-4">
              <span>Use mouse wheel to scroll</span>
              <span>•</span>
              <span>Click and drag to pan when zoomed</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Scale: {Math.round(scale * 100)}%</span>
              {rotation !== 0 && <span>• Rotation: {rotation}°</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
