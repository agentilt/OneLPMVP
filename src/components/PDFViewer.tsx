'use client'

import { useState } from 'react'
import { Download, ExternalLink, FileText, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface PDFViewerProps {
  url: string
  title: string
  onClose?: () => void
}

export function PDFViewer({ url, title, onClose }: PDFViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
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
              href={url}
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

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800 p-4">
          <div 
            className="mx-auto bg-white dark:bg-slate-900 shadow-lg rounded-lg overflow-hidden"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center top',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <iframe
              src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-[800px] border-0"
              title={title}
            />
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
