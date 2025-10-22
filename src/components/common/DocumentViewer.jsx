import { useState, useEffect } from 'react';
import { FileText, ExternalLink, Download, CheckCircle, Clock } from 'lucide-react';
import PDFViewer from './PDFViewer';
import { toast } from 'react-hot-toast';

const DocumentViewer = ({ document, courseId, onComplete, onProgress }) => {
  const [documentType, setDocumentType] = useState('pdf');
  const [documentUrl, setDocumentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    processDocument();
  }, [document]);

  const processDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!document?.url && !document?.file) {
        throw new Error('No document provided');
      }

      let url = document.url || document.file;
      let type = 'pdf';

      // Detect document type
      if (url.includes('.pdf') || document.type === 'pdf') {
        type = 'pdf';
        setDocumentUrl(url);
      } else if (url.includes('.doc') || url.includes('.docx') || document.type === 'word') {
        // Convert Word to PDF using Google Docs Viewer
        type = 'pdf';
        setDocumentUrl(`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`);
      } else if (url.startsWith('http') && !url.includes('.pdf')) {
        // Website link - convert to PDF using a service or show in iframe
        type = 'web';
        setDocumentUrl(url);
      } else {
        // Try to display as PDF
        type = 'pdf';
        setDocumentUrl(url);
      }

      setDocumentType(type);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleProgress = (progress) => {
    if (onProgress) {
      onProgress(progress);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-sm theme-text-secondary">Processing document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <FileText className="w-16 h-16 theme-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold theme-text-primary mb-2">Document Error</h3>
          <p className="theme-text-muted mb-4">{error}</p>
          <button
            onClick={processDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (documentType === 'pdf') {
    return (
      <PDFViewer
        documentUrl={documentUrl}
        documentId={document.id}
        courseId={courseId}
        onComplete={handleComplete}
        onProgress={handleProgress}
      />
    );
  }

  if (documentType === 'web') {
    return (
      <div className="flex flex-col h-full">
        {/* Web Document Toolbar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            <span className="font-medium theme-text-primary">Web Document</span>
            <span className="text-sm theme-text-secondary">({document.title})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Original</span>
            </a>
            
            <button
              onClick={handleComplete}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Complete</span>
            </button>
          </div>
        </div>

        {/* Web Content */}
        <div className="flex-1">
          <iframe
            src={documentUrl}
            className="w-full h-full border-0"
            title={document.title || 'Web Document'}
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>
    );
  }

  return null;
};

export default DocumentViewer;