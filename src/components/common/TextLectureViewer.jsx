import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TextLectureViewer = ({ lecture, courseId, onComplete, onProgress }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Calculate estimated reading time (average 200 words per minute)
    const wordCount = lecture.content ? lecture.content.split(' ').length : 0;
    const estimatedMinutes = Math.ceil(wordCount / 200);
    setEstimatedTime(estimatedMinutes);

    // Load completion status
    loadProgress();

    // Start reading timer
    const timer = setInterval(() => {
      setReadingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [lecture.id]);

  useEffect(() => {
    // Auto-complete based on reading time
    if (readingTime >= estimatedTime * 60 && !isCompleted) {
      const progress = Math.min(100, (readingTime / (estimatedTime * 60)) * 100);
      if (onProgress) {
        onProgress(progress);
      }
    }
  }, [readingTime, estimatedTime, isCompleted]);

  const loadProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/progress/lecture/${lecture.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsCompleted(data.completed || false);
      }
    } catch (error) {
      console.error('Failed to load progress');
    }
  };

  const markAsComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/progress/lecture/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lectureId: lecture.id,
          courseId,
          completed: true,
          readingTime
        })
      });

      if (response.ok) {
        setIsCompleted(true);
        toast.success('Lecture marked as complete!');
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      toast.error('Failed to mark as complete');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Lecture Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold theme-text-primary">{lecture.title}</h1>
            <div className="flex items-center space-x-4 mt-1 text-sm theme-text-secondary">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Est. {estimatedTime} min read</span>
              </span>
              <span>•</span>
              <span>Reading time: {formatTime(readingTime)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/50 transition-colors"
            title={isVisible ? 'Hide content' : 'Show content'}
          >
            {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (readingTime / (estimatedTime * 60)) * 100)}%` }}
              ></div>
            </div>
            <span className="text-xs theme-text-secondary min-w-[3rem]">
              {Math.round(Math.min(100, (readingTime / (estimatedTime * 60)) * 100))}%
            </span>
          </div>

          <button
            onClick={markAsComplete}
            disabled={isCompleted}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
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

      {/* Lecture Content */}
      {isVisible && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {lecture.description && (
              <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <p className="text-blue-800 dark:text-blue-200 italic">{lecture.description}</p>
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div 
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: `<p class="mb-4">${formatContent(lecture.content)}</p>` 
                }}
              />
            </div>

            {lecture.keyPoints && lecture.keyPoints.length > 0 && (
              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold theme-text-primary mb-4">Key Points</h3>
                <ul className="space-y-2">
                  {lecture.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="theme-text-secondary">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lecture.resources && lecture.resources.length > 0 && (
              <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="text-lg font-semibold theme-text-primary mb-4">Additional Resources</h3>
                <div className="space-y-2">
                  {lecture.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-all"
                    >
                      <div className="font-medium text-blue-600 hover:text-blue-700">{resource.title}</div>
                      {resource.description && (
                        <div className="text-sm theme-text-secondary mt-1">{resource.description}</div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 text-center">
              <button
                onClick={markAsComplete}
                disabled={isCompleted}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isCompleted 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCompleted ? '✓ Lecture Completed' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextLectureViewer;