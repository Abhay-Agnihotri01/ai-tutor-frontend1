import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, FileText, Upload, Link, File } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';

const CreateTextLecture = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapterId');
  const courseId = searchParams.get('courseId');
  
  const [formData, setFormData] = useState({
    title: '',
    file: null,
    url: '',
    uploadType: 'file' // 'file' or 'url'
  });
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);

  useEffect(() => {
    if (courseId && chapterId) {
      fetchCourseData();
    }
  }, [courseId, chapterId]);

  const fetchCourseData = async () => {
    try {
      const [courseResponse, chaptersResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/courses/${courseId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`http://localhost:5000/api/courses/${courseId}/chapters`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData.course);
      }
      
      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json();
        const currentChapter = chaptersData.chapters?.find(ch => ch.id === chapterId);
        setChapter(currentChapter);
      }
    } catch (error) {
      toast.error('Failed to load course data');
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, DOC, DOCX, or TXT files only');
      return;
    }
    
    setFormData(prev => ({ ...prev, file }));
    
    // If it's not a PDF, show converting status
    if (file.type !== 'application/pdf') {
      setConverting(true);
      setTimeout(() => {
        setConverting(false);
        toast.success('File ready for upload');
      }, 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (formData.uploadType === 'file' && !formData.file) {
      toast.error('Please select a file');
      return;
    }
    
    if (formData.uploadType === 'url' && !formData.url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('chapterId', chapterId);
      formDataToSend.append('courseId', courseId);
      formDataToSend.append('uploadType', formData.uploadType);
      
      if (formData.uploadType === 'file') {
        formDataToSend.append('file', formData.file);
      } else {
        formDataToSend.append('url', formData.url);
      }

      const response = await fetch('http://localhost:5000/api/text-lectures', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('Text lecture created successfully!');
        navigate(`/instructor/course/${courseId}/builder`);
      } else {
        throw new Error('Failed to create text lecture');
      }
    } catch (error) {
      toast.error('Failed to create text lecture');
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (!formData.file && !formData.url) {
      return (
        <div className="max-w-4xl mx-auto p-8 theme-bg-primary">
          <div className="theme-card p-8 rounded-lg text-center">
            <FileText className="w-16 h-16 theme-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold theme-text-primary mb-2">No Content to Preview</h3>
            <p className="theme-text-muted">Upload a file or enter a URL to see the preview</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-4xl mx-auto p-8 theme-bg-primary">
        <div className="theme-card p-8 rounded-lg">
          <div className="mb-6">
            <h1 className="text-3xl font-bold theme-text-primary mb-2">{formData.title}</h1>
            <div className="flex items-center space-x-4 text-sm theme-text-muted">
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>
                  {formData.uploadType === 'file' 
                    ? formData.file?.name 
                    : 'Web Content'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-2 border-dashed theme-border rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 theme-text-muted mx-auto mb-4" />
            <p className="theme-text-primary font-medium mb-2">PDF Preview</p>
            <p className="theme-text-muted text-sm">
              {formData.uploadType === 'file' 
                ? `File: ${formData.file?.name}` 
                : `URL: ${formData.url}`
              }
            </p>
            <p className="theme-text-muted text-xs mt-2">
              Students will see the full PDF content here
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-bg-primary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/instructor/course/${courseId}/builder`)}
              className="mr-4 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 theme-text-primary" />
            </button>
            <div>
              <h1 className="text-3xl font-bold theme-text-primary">Create Text Lecture</h1>
              <p className="theme-text-secondary">
                {course?.title} • {chapter?.title}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        {isPreview ? renderPreview() : (
          <div className="theme-card p-8 rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-2">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter lecture title"
                  required
                />
              </div>

              {/* Upload Type Selection */}
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-3">
                  Content Source
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadType"
                      value="file"
                      checked={formData.uploadType === 'file'}
                      onChange={(e) => setFormData(prev => ({ ...prev, uploadType: e.target.value }))}
                      className="mr-2"
                    />
                    <File className="w-4 h-4 mr-1" />
                    Upload File
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadType"
                      value="url"
                      checked={formData.uploadType === 'url'}
                      onChange={(e) => setFormData(prev => ({ ...prev, uploadType: e.target.value }))}
                      className="mr-2"
                    />
                    <Link className="w-4 h-4 mr-1" />
                    Website URL
                  </label>
                </div>
              </div>

              {/* File Upload */}
              {formData.uploadType === 'file' && (
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Upload Document
                  </label>
                  <div className="border-2 border-dashed theme-border rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-12 h-12 theme-text-muted mx-auto mb-4" />
                      <div className="mb-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-primary-600 hover:text-primary-500 font-medium">
                            Click to upload
                          </span>
                          <span className="theme-text-muted"> or drag and drop</span>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => handleFileUpload(e.target.files[0])}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs theme-text-muted">
                        PDF, DOC, DOCX, TXT up to 10MB
                      </p>
                      {converting && (
                        <div className="mt-4 flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span className="text-sm theme-text-muted">Converting to PDF...</span>
                        </div>
                      )}
                      {formData.file && (
                        <div className="mt-4 p-3 theme-bg-secondary rounded-lg">
                          <p className="text-sm theme-text-primary font-medium">{formData.file.name}</p>
                          <p className="text-xs theme-text-muted">
                            {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* URL Input */}
              {formData.uploadType === 'url' && (
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/article"
                  />
                  <p className="text-xs theme-text-muted mt-1">
                    The webpage will be converted to PDF for students
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t theme-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/instructor/course/${courseId}/builder`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || converting}
                >
                  {loading ? 'Creating...' : 'Create Lecture'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTextLecture;