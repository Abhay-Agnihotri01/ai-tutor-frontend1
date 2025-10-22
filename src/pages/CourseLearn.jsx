import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, CheckCircle, Clock, FileText, ChevronDown, ChevronRight, Star, Download, HelpCircle, BookOpen } from 'lucide-react';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import RatingModal from '../components/common/RatingModal';
import VideoThumbnail from '../components/common/VideoThumbnail';
import LinkifiedText from '../components/common/LinkifiedText';
import QuizTaker from '../components/quiz/QuizTaker';
import EnhancedVideoPlayer from '../components/common/EnhancedVideoPlayer';
import StudentNotes from '../components/notes/StudentNotes';
import AllNotesModal from '../components/notes/AllNotesModal';
import SimpleTextLectureNotes from '../components/notes/SimpleTextLectureNotes';
import LiveClassList from '../components/live/LiveClassList';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CourseLearn = () => {
const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentTextLecture, setCurrentTextLecture] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [expandedChapters, setExpandedChapters] = useState(new Set(['1']));
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState({ isOpen: false, existingRating: null });
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState({});
  const [quizAttempts, setQuizAttempts] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [notesView, setNotesView] = useState('lecture'); // 'lecture' or 'student'
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [allNotes, setAllNotes] = useState([]);

  const handleJumpToTime = (videoId, timestamp) => {
    // Find and switch to the video if it's not current
    if (currentLesson?.id !== videoId) {
      const targetVideo = course?.chapters?.find(chapter => 
        chapter.videos?.some(video => video.id === videoId)
      )?.videos?.find(video => video.id === videoId);
      
      if (targetVideo) {
        setCurrentLesson(targetVideo);
      }
    }
    
    // Jump to timestamp using custom event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('jumpToTime', { 
        detail: { timestamp } 
      }));
    }, 100);
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);
  
  useEffect(() => {
    if (course) {
      loadVideoProgress();
      loadEnrollmentProgress();
    }
  }, [course, id]);
  
  const loadVideoProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !id) return;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/enrollments/video-progress/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.progress) {
        // Get all completed content IDs (both videos and text lectures)
        const completedContentIds = response.data.progress
          .filter(p => p.completed)
          .map(p => p.videoId); // videoId field stores both video and text lecture IDs
        setCompletedLessons(new Set(completedContentIds));
      }
    } catch (error) {

    }
  };
  
  // Refresh progress less frequently to avoid conflicts
  useEffect(() => {
    const interval = setInterval(loadVideoProgress, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [id]);
  
  useEffect(() => {
    if (course?.chapters) {
      fetchQuizzes();
    }
  }, [course]);
  
  // Auto-refresh quizzes every 30 seconds to catch updates
  useEffect(() => {
    if (!course?.chapters) return;
    
    const interval = setInterval(() => {
      fetchQuizzes();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [course]);
  
  // Listen for video completion events
  useEffect(() => {
    const handleVideoCompleted = (event) => {
      const { videoId } = event.detail;
      setCompletedLessons(prev => new Set([...prev, videoId]));
    };
    
    window.addEventListener('videoCompleted', handleVideoCompleted);
    return () => window.removeEventListener('videoCompleted', handleVideoCompleted);
  }, []);

  const fetchCourse = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/courses/${id}`);
      const course = response.data.course;
      if (course) {
        setCourse(course);
        // Set first content as current if chapters exist and no current lesson
        if (!currentLesson && !currentTextLecture && course.chapters?.[0]) {
          const firstChapter = course.chapters[0];
          const allContent = [
            ...(firstChapter.videos || []).map(v => ({ ...v, contentType: 'video' })),
            ...(firstChapter.resources || []).map(r => ({ ...r, contentType: 'resource' })),
            ...((firstChapter.text_lectures || firstChapter.textLectures) || []).map(t => ({ ...t, contentType: 'text_lecture' }))
          ].sort((a, b) => a.order - b.order);
          
          const firstContent = allContent[0];
          if (firstContent) {
            if (firstContent.contentType === 'video') {
              setCurrentLesson(firstContent);
            } else if (firstContent.contentType === 'text_lecture') {
              setCurrentTextLecture(firstContent);
            }
          }
        }
        // If current lesson was deleted, find next available video
        if (currentLesson) {
          const videoExists = course.chapters?.some(chapter => 
            chapter.videos?.some(video => video.id === currentLesson.id)
          );
          if (!videoExists) {
            const firstAvailableVideo = course.chapters?.find(chapter => chapter.videos?.length > 0)?.videos?.[0];
            setCurrentLesson(firstAvailableVideo || null);
          }
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async (forceRefresh = false) => {
    if (!course?.chapters) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    
    // Clear existing data if force refresh
    if (forceRefresh) {
      setQuizzes({});
      setQuizAttempts({});
      setRefreshKey(prev => prev + 1);
    }
    
    try {
      const quizData = {};
      const attemptData = {};
      
      for (const chapter of course.chapters) {
        try {
          // Use multiple cache busting techniques
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(7);
          const refreshId = refreshKey;
          const cacheKey = forceRefresh ? `force_${timestamp}_${randomId}_${refreshId}` : `${timestamp}_${randomId}_${refreshId}`;
          
          const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quiz/chapter/${chapter.id}?cb=${cacheKey}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'If-None-Match': '*',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          if (response.data.success) {
            quizData[chapter.id] = response.data.quizzes;
            
            // Fetch attempt status for each quiz
            for (const quiz of response.data.quizzes) {
              try {
                const attemptResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quiz/attempt/status/${quiz.id}?cb=${cacheKey}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'If-None-Match': '*',
                    'X-Requested-With': 'XMLHttpRequest'
                  }
                });
                if (attemptResponse.data.success) {
                  attemptData[quiz.id] = {
                    hasAttempted: attemptResponse.data.hasAttempted,
                    canRetake: attemptResponse.data.canRetake,
                    attempt: attemptResponse.data.attempt,
                    quizVersion: attemptResponse.data.quizVersion
                  };
                }
              } catch (attemptError) {
                // Set default values so quiz still shows
                attemptData[quiz.id] = {
                  hasAttempted: false,
                  canRetake: false,
                  attempt: null,
                  quizVersion: 1
                };
              }
            }
          }
        } catch (chapterError) {
          quizData[chapter.id] = []; // Set empty array for failed chapters
        }
      }
      setQuizzes(quizData);
      setQuizAttempts(attemptData);
    } catch (error) {
      // Error fetching quizzes
    }
  };

  const startQuiz = async (quiz) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to take the quiz');
      return;
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/quiz/attempt/start`, 
        { quizId: quiz.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        const quizData = {
          ...response.data.attempt.quiz,
          attemptId: response.data.attempt.id
        };
        setActiveQuiz(quizData);
      } else {
        throw new Error(response.data.message || 'Failed to start quiz');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start quiz');
    }
  };

  const handleQuizComplete = (result) => {
    setActiveQuiz(null);
    if (result.score !== undefined) {
      toast.success(`Quiz completed! Score: ${result.score}/${result.totalMarks} (${result.percentage}%)`);
    }
    fetchQuizzes(true); // Force refresh to show completion status
  };

  const toggleChapter = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const selectLesson = (lesson) => {
    setCurrentLesson(lesson);
    setCurrentTextLecture(null);
  };

  const selectTextLecture = (textLecture) => {
    setCurrentTextLecture(textLecture);
    setCurrentLesson(null);
  };
  
  const getNextContent = () => {
    if (!course?.chapters || !currentLesson) return null;
    
    // Find current lesson in the course structure
    for (let chapterIndex = 0; chapterIndex < course.chapters.length; chapterIndex++) {
      const chapter = course.chapters[chapterIndex];
      const allContent = [
        ...(chapter.videos || []).map(v => ({ ...v, contentType: 'video' })),
        ...(chapter.resources || []).map(r => ({ ...r, contentType: 'resource' })),
        ...((chapter.text_lectures || chapter.textLectures) || []).map(t => ({ ...t, contentType: 'text_lecture' })),
        ...(quizzes[chapter.id] || []).map(q => ({ ...q, contentType: 'quiz' }))
      ].sort((a, b) => a.order - b.order);
      
      const currentIndex = allContent.findIndex(item => 
        (item.contentType === 'video' && item.id === currentLesson?.id) ||
        (item.contentType === 'text_lecture' && item.id === currentTextLecture?.id)
      );
      
      if (currentIndex !== -1) {
        // Check if there's next content in same chapter
        if (currentIndex + 1 < allContent.length) {
          return allContent[currentIndex + 1];
        }
        // Check next chapter
        if (chapterIndex + 1 < course.chapters.length) {
          const nextChapter = course.chapters[chapterIndex + 1];
          const nextChapterContent = [
            ...(nextChapter.videos || []).map(v => ({ ...v, contentType: 'video' })),
            ...(nextChapter.resources || []).map(r => ({ ...r, contentType: 'resource' })),
            ...((nextChapter.text_lectures || nextChapter.textLectures) || []).map(t => ({ ...t, contentType: 'text_lecture' })),
            ...(quizzes[nextChapter.id] || []).map(q => ({ ...q, contentType: 'quiz' }))
          ].sort((a, b) => a.order - b.order);
          return nextChapterContent[0] || null;
        }
      }
    }
    return null;
  };
  
  const autoAdvanceToNext = () => {
    const nextContent = getNextContent();
    if (nextContent) {
      if (nextContent.contentType === 'video') {
        setCurrentLesson(nextContent);
        setCurrentTextLecture(null);
        toast.success(`Auto-advancing to: ${nextContent.title}`);
      } else if (nextContent.contentType === 'text_lecture') {
        setCurrentTextLecture(nextContent);
        setCurrentLesson(null);
        toast.success(`Auto-advancing to: ${nextContent.title}`);
      } else if (nextContent.contentType === 'quiz') {
        toast.success(`Next: ${nextContent.title} (Quiz)`);
      } else if (nextContent.contentType === 'resource') {
        toast.success(`Next: ${nextContent.title} (Resource)`);
      }
    } else {
      toast.success('Course completed! 🎉');
    }
  };

  const markLessonComplete = async () => {
    if (currentLesson) {
      setCompletedLessons(prev => new Set([...prev, currentLesson.id]));
      toast.success('Lesson marked as complete!');
    } else if (currentTextLecture) {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        await axios.post(`${apiUrl}/api/enrollments/mark-content-complete`, {
          courseId: id,
          contentId: currentTextLecture.id,
          contentType: 'text_lecture'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setCompletedLessons(prev => new Set([...prev, currentTextLecture.id]));
        toast.success('Text lecture marked as complete!');
      } catch (error) {
        toast.error('Failed to mark as complete');
      }
    }
  };

  const getProgress = () => {
    if (!course?.chapters) return 0;
    const totalContent = course.chapters.reduce((acc, chapter) => {
      const videos = chapter.videos?.length || 0;
      const textLectures = (chapter.text_lectures || chapter.textLectures)?.length || 0;
      return acc + videos + textLectures;
    }, 0);
    return totalContent > 0 ? (completedLessons.size / totalContent) * 100 : 0;
  };
  
  const loadEnrollmentProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/enrollments/my-courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const enrollment = response.data.enrollments.find(e => e.courseId === id);
        if (enrollment) {
          // Enrollment loaded successfully
        }
      }
    } catch (error) {
      // Failed to load enrollment progress
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRateClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to rate this course');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/ratings/course/${id}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        toast.error('Please login to rate this course');
        return;
      }
      
      const data = await response.json();
      
      setRatingModal({
        isOpen: true,
        existingRating: data.rating
      });
    } catch (error) {
      setRatingModal({
        isOpen: true,
        existingRating: null
      });
    }
  };

  const handleRatingSubmit = async ({ rating, review }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to rate this course');
      throw new Error('No token');
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: id,
          rating,
          review
        })
      });
      
      if (response.status === 401 || response.status === 403) {
        toast.error('Please login to rate this course');
        throw new Error('Authentication failed');
      }
      
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      
      // Refresh course to get updated rating
      fetchCourse();
      setRatingModal({ isOpen: false, existingRating: null });
      toast.success('Rating submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit rating');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold theme-text-primary mb-2">Course not found</h2>
          <p className="theme-text-secondary">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      {/* Progress Bar */}
      <div className="theme-bg-secondary border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold theme-text-primary">{course.title}</h1>
            <span className="text-sm theme-text-secondary">{Math.round(getProgress())}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Main Content - Video Player or Text Lecture */}
        <div className="flex-1 p-6">
          {currentTextLecture ? (
            <div className="animate-fade-in">
              {/* Text Lecture Viewer */}
              <div className="mb-6 aspect-video">
                {currentTextLecture.uploadType === 'url' ? (
                  <iframe
                    src={currentTextLecture.filePath}
                    className="w-full h-full rounded-lg border theme-border"
                    title={currentTextLecture.title}
                  />
                ) : (
                  <iframe
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${currentTextLecture.filePath}`}
                    className="w-full h-full rounded-lg border theme-border"
                    title={currentTextLecture.title}
                  />
                )}
              </div>

              {/* Text Lecture Info */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold theme-text-primary">{currentTextLecture.title}</h2>
                  <div className="flex items-center space-x-2 text-sm theme-text-secondary">
                    <FileText className="w-4 h-4" />
                    <span>Text Lecture</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {completedLessons.has(currentTextLecture.id) ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">Completed</span>
                      </div>
                    ) : (
                      <Button onClick={markLessonComplete} className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content Section - Text Lecture Notes */}
                <div className="theme-card p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <FileText className="w-5 h-5 mr-2 theme-text-secondary" />
                    <h3 className="font-semibold theme-text-primary">Notes</h3>
                  </div>
                  <SimpleTextLectureNotes
                    textLectureId={currentTextLecture.id}
                    courseId={id}
                    inline={true}
                  />
                </div>
              </div>
            </div>
          ) : currentLesson ? (
            <div className="animate-fade-in">
              {/* Enhanced Video Player */}
              <div className="mb-6 aspect-video">
                <EnhancedVideoPlayer
                  key={currentLesson.id}
                  src={currentLesson.videoUrl}
                  poster={currentLesson.thumbnailUrl || 
                    (currentLesson.videoUrl?.includes('cloudinary.com') ? 
                      currentLesson.videoUrl.replace('/video/upload/', '/video/upload/so_10,w_400,h_225,c_fill,q_auto,f_jpg/').replace('.mp4', '.jpg') : 
                      undefined
                    )
                  }
                  videoId={currentLesson.id}
                  courseId={id}
                  onEnded={autoAdvanceToNext}
                  onTimeUpdate={(time) => setCurrentTime(time)}
                  className="w-full h-full"
                />
              </div>

              {/* Lesson Info */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold theme-text-primary">{currentLesson.title}</h2>
                  <div className="flex items-center space-x-2 text-sm theme-text-secondary">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(currentLesson.duration)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {completedLessons.has(currentLesson.id) ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">Completed</span>
                      </div>
                    ) : (
                      <Button onClick={markLessonComplete} className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                  
                  {/* Navigation Tabs */}
                  <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                      onClick={() => setNotesView('lecture')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center ${
                        notesView === 'lecture' 
                          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-700' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Lecture Notes
                    </button>
                    <button
                      onClick={() => setNotesView('student')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center ${
                        notesView === 'student' 
                          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-700' 
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      My Notes
                    </button>
                  </div>
                </div>

                {/* Content Section - Changes based on selected tab */}
                <div className="theme-card p-6 rounded-lg">
                  {notesView === 'lecture' ? (
                    /* Lecture Notes Content */
                    <div>
                      <div className="flex items-center mb-4">
                        <FileText className="w-5 h-5 mr-2 theme-text-secondary" />
                        <h3 className="font-semibold theme-text-primary">Lecture Notes</h3>
                      </div>
                      {currentLesson.description ? (
                        <LinkifiedText 
                          text={currentLesson.description} 
                          className="theme-text-secondary leading-relaxed whitespace-pre-wrap"
                        />
                      ) : (
                        <p className="theme-text-muted italic">
                          No lecture notes provided for this video.
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Student Notes Content */
                    <div>
                      <div className="flex items-center mb-4">
                        <BookOpen className="w-5 h-5 mr-2 theme-text-secondary" />
                        <h3 className="font-semibold theme-text-primary">My Notes</h3>
                      </div>
                      <StudentNotes
                        videoId={currentLesson.id}
                        courseId={id}
                        currentTime={currentTime}
                        inline={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Play className="w-16 h-16 theme-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold theme-text-primary mb-2">No videos available</h3>
                <p className="theme-text-secondary">This course doesn't have any videos yet.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Course Content Only */}
        <div className="w-80 theme-bg-primary border-l theme-border">
          {/* Sidebar Header */}
          <div className="p-6 border-b theme-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold theme-text-primary">Course Content</h3>
              <button
                onClick={() => setNotesModalOpen(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors flex items-center"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                My Notes
              </button>
            </div>
            <div className="flex items-center justify-between text-sm theme-text-secondary mb-3">
              <span>
                {course.chapters?.reduce((acc, ch) => {
                  const videos = ch.videos?.length || 0;
                  const textLectures = (ch.text_lectures || ch.textLectures)?.length || 0;
                  return acc + videos + textLectures;
                }, 0)} items
              </span>
              <span>{Math.round(getProgress())}% complete</span>
            </div>
            
            {/* Course Rating */}
            <div className="flex items-center justify-between">
              <StarRating rating={course.rating || 0} readonly size="sm" />
              <button
                onClick={handleRateClick}
                className="text-xs theme-text-muted hover:text-primary-600 transition-colors flex items-center space-x-1"
              >
                <Star className="w-3 h-3" />
                <span>Rate Course</span>
              </button>
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className="h-full overflow-y-auto">
            {notesModalOpen ? (
              /* Notes View */
              <AllNotesModal
                courseId={id}
                course={course}
                isOpen={notesModalOpen}
                onClose={() => setNotesModalOpen(false)}
                onJumpToTime={handleJumpToTime}
                inline={true}
              />
            ) : (
              /* Chapter Content */
              <div className="p-4 space-y-6">
                {/* Live Classes Section */}
                <LiveClassList courseId={id} />
                
                {/* Course Chapters */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold theme-text-primary">Course Chapters</h3>
                  {course.chapters?.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="animate-slide-up" style={{animationDelay: `${chapterIndex * 0.1}s`}}>
                  {/* Chapter Header */}
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full group"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-all duration-200 group-hover:shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-600">{chapterIndex + 1}</span>
                        </div>
                        <span className="font-semibold theme-text-primary text-left">{chapter.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs theme-text-muted">
                          {(chapter.videos?.length || 0) + (chapter.resources?.length || 0) + ((chapter.text_lectures || chapter.textLectures)?.length || 0)} items
                        </span>
                        {expandedChapters.has(chapter.id) ? (
                          <ChevronDown className="w-4 h-4 theme-text-secondary transition-transform" />
                        ) : (
                          <ChevronRight className="w-4 h-4 theme-text-secondary transition-transform" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Chapter Videos */}
                  {expandedChapters.has(chapter.id) && (
                    <div className="mt-2 ml-4 space-y-1 animate-slide-up">
                      {/* Mixed Content - Videos, Resources, and Text Lectures sorted by order */}
                      {[
                        ...(chapter.videos || []).map(v => ({ ...v, contentType: 'video' })),
                        ...(chapter.resources || []).map(r => ({ ...r, contentType: 'resource' })),
                        ...((chapter.text_lectures || chapter.textLectures) || []).map(t => ({ ...t, contentType: 'text_lecture' }))
                      ]
                      .sort((a, b) => a.order - b.order)
                      .map((item) => {
                        if (item.contentType === 'video') {
                          const lesson = item;
                          const lessonIndex = chapter.videos.findIndex(v => v.id === lesson.id);
                          return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          className={`w-full group transition-all duration-200 ${
                            currentLesson?.id === lesson.id 
                              ? 'bg-primary-50 dark:bg-primary-900/30 border-l-3 border-primary-500' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          } rounded-r-lg`}
                        >
                          <div className="flex items-center space-x-3 p-3">
                            {/* Lesson Status Icon */}
                            <div className="flex-shrink-0">
                              {completedLessons.has(lesson.id) ? (
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              ) : currentLesson?.id === lesson.id ? (
                                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                  <Play className="w-3 h-3 text-white fill-current" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded overflow-hidden">
                                  <VideoThumbnail
                                    videoUrl={lesson.videoUrl}
                                    thumbnailUrl={lesson.thumbnailUrl}
                                    alt={lesson.title}
                                    className="w-full h-full"
                                    showPlayIcon={false}
                                  />
                                </div>
                              )}
                              {!lesson.thumbnailUrl && !completedLessons.has(lesson.id) && currentLesson?.id !== lesson.id && (
                                <div className="w-6 h-6 rounded-full border-2 theme-border flex items-center justify-center group-hover:border-primary-300">
                                  <span className="text-xs font-medium theme-text-muted">{lessonIndex + 1}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <p className={`text-sm font-medium truncate transition-colors ${
                                currentLesson?.id === lesson.id 
                                  ? 'text-primary-600 dark:text-primary-400' 
                                  : completedLessons.has(lesson.id)
                                    ? 'theme-text-primary'
                                    : 'theme-text-primary group-hover:text-primary-600'
                              }`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Clock className="w-3 h-3 theme-text-muted" />
                                <span className="text-xs theme-text-muted">
                                  {formatDuration(lesson.duration)}
                                </span>
                                {completedLessons.has(lesson.id) && (
                                  <span className="text-xs text-green-600 font-medium">Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                          );
                        } else if (item.contentType === 'resource') {
                          const resource = item;
                          return (
                            <div
                              key={resource.id}
                              className="p-3 theme-bg-secondary hover:theme-bg-tertiary rounded-lg border-l-4 border-green-500 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center flex-shrink-0">
                                    <span className="text-green-600 text-xs">📄</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium theme-text-primary truncate" title={resource.title}>
                                      {resource.title}
                                    </p>
                                    <p className="text-xs theme-text-muted truncate">
                                      {resource.fileName} • {(resource.fileSize / 1024 / 1024).toFixed(1)}MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const token = localStorage.getItem('token');
                                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                    const url = `${apiUrl}/api/download/resource/${resource.id}?token=${token}`;
                                    window.open(url, '_blank');
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex-shrink-0"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          const textLecture = item;
                          return (
                            <button
                              key={textLecture.id}
                              onClick={() => selectTextLecture(textLecture)}
                              className={`w-full group transition-all duration-200 ${
                                currentTextLecture?.id === textLecture.id 
                                  ? 'bg-primary-50 dark:bg-primary-900/30 border-l-3 border-primary-500' 
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              } rounded-r-lg`}
                            >
                              <div className="flex items-center space-x-3 p-3">
                                {/* Text Lecture Status Icon */}
                                <div className="flex-shrink-0">
                                  {completedLessons.has(textLecture.id) ? (
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                  ) : currentTextLecture?.id === textLecture.id ? (
                                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                      <FileText className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Text Lecture Info */}
                                <div className="flex-1 min-w-0 text-left">
                                  <p className={`text-sm font-medium truncate transition-colors ${
                                    currentTextLecture?.id === textLecture.id 
                                      ? 'text-primary-600 dark:text-primary-400' 
                                      : completedLessons.has(textLecture.id)
                                        ? 'theme-text-primary'
                                        : 'theme-text-primary group-hover:text-primary-600'
                                  }`}>
                                    {textLecture.title}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <FileText className="w-3 h-3 theme-text-muted" />
                                    <span className="text-xs theme-text-muted">
                                      {textLecture.uploadType === 'url' ? 'Web Content' : 'Document'}
                                    </span>
                                    {completedLessons.has(textLecture.id) && (
                                      <span className="text-xs text-green-600 font-medium">Completed</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        }
                      })}
                      
                      {/* Old code - remove this section */}
                      {false && chapter.videos && chapter.videos.length > 0 ? (
                        chapter.videos.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          className={`w-full group transition-all duration-200 ${
                            currentLesson?.id === lesson.id 
                              ? 'bg-primary-50 dark:bg-primary-900/30 border-l-3 border-primary-500' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          } rounded-r-lg`}
                        >
                          <div className="flex items-center space-x-3 p-3">
                            {/* Lesson Status Icon */}
                            <div className="flex-shrink-0">
                              {completedLessons.has(lesson.id) ? (
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              ) : currentLesson?.id === lesson.id ? (
                                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                  <Play className="w-3 h-3 text-white fill-current" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded overflow-hidden">
                                  <VideoThumbnail
                                    videoUrl={lesson.videoUrl}
                                    thumbnailUrl={lesson.thumbnailUrl}
                                    alt={lesson.title}
                                    className="w-full h-full"
                                    showPlayIcon={false}
                                  />
                                </div>
                              )}
                              {!lesson.thumbnailUrl && !completedLessons.has(lesson.id) && currentLesson?.id !== lesson.id && (
                                <div className="w-6 h-6 rounded-full border-2 theme-border flex items-center justify-center group-hover:border-primary-300">
                                  <span className="text-xs font-medium theme-text-muted">{lessonIndex + 1}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <p className={`text-sm font-medium truncate transition-colors ${
                                currentLesson?.id === lesson.id 
                                  ? 'text-primary-600 dark:text-primary-400' 
                                  : completedLessons.has(lesson.id)
                                    ? 'theme-text-primary'
                                    : 'theme-text-primary group-hover:text-primary-600'
                              }`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Clock className="w-3 h-3 theme-text-muted" />
                                <span className="text-xs theme-text-muted">
                                  {formatDuration(lesson.duration)}
                                </span>
                                {completedLessons.has(lesson.id) && (
                                  <span className="text-xs text-green-600 font-medium">Completed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                        ))
                      ) : null}
                      
                      {/* Chapter Quizzes */}
                      {quizzes[chapter.id] && quizzes[chapter.id].length > 0 && quizzes[chapter.id].map((quiz) => {
                        const attemptData = quizAttempts[quiz.id];
                        const isSubmitted = attemptData && attemptData.hasAttempted;
                        const canRetake = attemptData && attemptData.canRetake;
                        const attempt = attemptData && attemptData.attempt;
                        
                        // For assignments, check if it's graded or just submitted
                        const isAssignmentPendingReview = quiz.type === 'assignment' && isSubmitted && attempt?.status === 'completed';
                        const isAssignmentGraded = quiz.type === 'assignment' && isSubmitted && attempt?.status === 'graded';
                        
                        return (
                          <button
                            key={quiz.id}
                            onClick={() => {
                              if (isSubmitted && !canRetake) {
                                if (quiz.type === 'assignment' && isAssignmentPendingReview) {
                                  toast('Assignment submitted. Waiting for instructor review.');
                                } else {
                                  toast(`Already submitted. Score: ${attempt?.score || 'Pending'}/${quiz.totalMarks}`);
                                }
                                return;
                              }
                              if (!quiz.isReady) {
                                toast.error('This quiz is not ready yet. Please contact your instructor.');
                                return;
                              }
                              if (canRetake) {
                                toast('Quiz has been updated! You can retake it.', { icon: '🔄' });
                              }
                              quiz.type === 'assignment' ? setActiveQuiz(quiz) : startQuiz(quiz);
                            }}
                            disabled={!quiz.isReady && !isSubmitted && !canRetake}
                            className={`w-full rounded-lg border transition-all duration-200 ${
                              canRetake
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                : isAssignmentPendingReview
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                : isSubmitted
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : !quiz.isReady
                                ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:shadow-sm'
                            }`}
                          >
                            <div className="p-4">
                              <div className="flex items-center space-x-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg p-2">
                                {/* Quiz Icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  canRetake
                                    ? 'bg-orange-100 dark:bg-orange-900/50'
                                    : isAssignmentPendingReview
                                    ? 'bg-yellow-100 dark:bg-yellow-900/50'
                                    : isSubmitted
                                    ? 'bg-green-100 dark:bg-green-900/50'
                                    : !quiz.isReady
                                    ? 'bg-gray-100 dark:bg-gray-800'
                                    : 'bg-blue-100 dark:bg-blue-900/50'
                                }`}>
                                  {canRetake ? (
                                    <HelpCircle className="w-5 h-5 text-orange-600" />
                                  ) : isAssignmentPendingReview ? (
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                  ) : isSubmitted ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <HelpCircle className="w-5 h-5 text-blue-600" />
                                  )}
                                </div>
                                
                                {/* Quiz Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className={`text-sm font-semibold truncate ${
                                      canRetake
                                        ? 'text-orange-700 dark:text-orange-300'
                                        : isAssignmentPendingReview
                                        ? 'text-yellow-700 dark:text-yellow-300'
                                        : isSubmitted
                                        ? 'theme-text-primary'
                                        : !quiz.isReady
                                        ? 'text-gray-500'
                                        : 'text-blue-700 dark:text-blue-300'
                                    }`}>
                                      {quiz.title}
                                    </h4>
                                    
                                    <div className="flex items-center space-x-2 ml-3">
                                      {canRetake && (
                                        <span className="px-2 py-1 text-xs bg-orange-500 text-white rounded-full font-medium">
                                          NEW
                                        </span>
                                      )}
                                      {isSubmitted && attempt && attempt.score !== undefined && isAssignmentGraded && (
                                        <span className="text-xs text-green-600 font-semibold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                          {attempt.score}/{quiz.totalMarks}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs theme-text-muted">
                                      {quiz.type === 'quiz' ? 'Quiz' : 'Assignment'} • {quiz.isReady ? `${quiz.totalMarks} marks` : 'Not ready'}
                                    </span>
                                    
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      canRetake
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                        : isAssignmentPendingReview
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                        : isSubmitted
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : !quiz.isReady
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    }`}>
                                      {canRetake
                                        ? 'Retake'
                                        : isAssignmentPendingReview
                                        ? 'Pending Review'
                                        : isSubmitted
                                        ? 'Completed'
                                        : !quiz.isReady
                                        ? 'Not Available'
                                        : quiz.type === 'quiz' ? 'Take Quiz' : 'Submit'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Feedback Section - Show directly when available */}
                              {quiz.type === 'assignment' && isAssignmentGraded && attempt?.feedback && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">📝 Instructor Feedback</span>
                                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                                      {Math.round((attempt.score / quiz.totalMarks) * 100)}%
                                    </span>
                                  </div>
                                  <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                                    {attempt.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      
                      {((!chapter.videos || chapter.videos.length === 0) && (!chapter.resources || chapter.resources.length === 0) && (!quizzes[chapter.id] || quizzes[chapter.id].length === 0)) && (
                        <div className="p-3 text-center text-sm theme-text-muted">
                          No content available yet
                        </div>
                      )}
                      

                    </div>
                  )}
                </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, existingRating: null })}
        courseTitle={course?.title}
        onSubmit={handleRatingSubmit}
        existingRating={ratingModal.existingRating}
      />
      
      {activeQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <QuizTaker
              quiz={activeQuiz}
              onComplete={handleQuizComplete}
            />
          </div>
        </div>
      )}
      

    </div>
  );
};

export default CourseLearn;