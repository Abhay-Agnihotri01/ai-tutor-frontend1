import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, BookOpen, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PDFViewer = ({ documentUrl, documentId, courseId, onComplete, onProgress }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Load reading progress
    loadProgress();
  }, [documentId]);

  useEffect(() => {
    // Update progress when page changes
    if (totalPages > 0) {
      const progress = Math.round((currentPage / totalPages) * 100);
      setReadingProgress(progress);
      saveProgress(progress);
      
      if (onProgress) {
        onProgress(progress);
      }
    }
  }, [currentPage, totalPages]);

  const loadProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/progress/document/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentPage(data.currentPage || 1);
        setReadingProgress(data.progress || 0);
        setIsCompleted(data.completed || false);
      }
    } catch (error) {
      console.error('Failed to load progress');
    }
  };

  const saveProgress = async (progress) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/progress/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          courseId,
          currentPage,
          progress,
          completed: progress >= 100
        })
      });
    } catch (error) {
      console.error('Failed to save progress');
    }
  };

  const markAsComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/progress/document/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          courseId,
          completed: true
        })
      });

      if (response.ok) {
        setIsCompleted(true);
        toast.success('Document marked as complete!');
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      toast.error('Failed to mark as complete');
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = 'document.pdf';
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="font-medium theme-text-primary">Document Viewer</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm theme-text-secondary">
            <span>Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
              className="w-16 px-2 py-1 text-center border rounded theme-border theme-bg-primary"
            />
            <span>of {totalPages}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Navigation Controls */}
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-sm theme-text-secondary min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={zoom >= 3}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

          {/* Additional Controls */}
          <button
            onClick={rotate}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={downloadPDF}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

          {/* Progress & Complete */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${readingProgress}%` }}
                ></div>
              </div>
              <span className="text-xs theme-text-secondary">{readingProgress}%</span>
            </div>
            
            <button
              onClick={markAsComplete}
              disabled={isCompleted}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                isCompleted 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="w-full h-full flex items-center justify-center p-4"
          style={{ 
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
        >
          <iframe
            ref={iframeRef}
            src={`${documentUrl}#page=${currentPage}&zoom=${zoom * 100}`}
            className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
            onLoad={() => setLoading(false)}
            title="PDF Document"
          />
        </div>
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm theme-text-secondary">Loading document...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;