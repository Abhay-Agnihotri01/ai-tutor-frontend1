import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical, Play, Upload, Edit, Trash2, FolderPlus, X, HelpCircle, FileText, ChevronDown, Video, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import QuizBuilder from '../../components/quiz/QuizBuilder';
import QuizEditor from '../../components/quiz/QuizEditor';
import LiveClassScheduler from '../../components/live/LiveClassScheduler';
import NotificationCenter from '../../components/instructor/NotificationCenter';
import axios from 'axios';

const CourseBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', file: null });
  const [chapterForm, setChapterForm] = useState({ title: '' });
  const [editingChapter, setEditingChapter] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [replacingVideo, setReplacingVideo] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showCourseSettings, setShowCourseSettings] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', file: null });
  const [editingResource, setEditingResource] = useState(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [selectedChapterForQuiz, setSelectedChapterForQuiz] = useState(null);
  const [chapterQuizzes, setChapterQuizzes] = useState({});
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [showAddDropdown, setShowAddDropdown] = useState(null);
  const [showLiveClassScheduler, setShowLiveClassScheduler] = useState(false);
  const [selectedChapterForLiveClass, setSelectedChapterForLiveClass] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [courseSettings, setCourseSettings] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: '',
    level: '',
    price: '',
    discountPrice: '',
    language: '',
    thumbnail: null
  });
  const fileInputRefs = useRef({});

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  useEffect(() => {
    if (chapters.length > 0) {
      fetchQuizzes();
      fetchLiveClasses();
    }
  }, [chapters]);

  const fetchLiveClasses = async () => {
    try {
      const response = await axios.get(`/api/live-classes/course/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      setLiveClasses(response.data.liveClasses || []);
    } catch (error) {
      console.error('Error fetching live classes:', error);
    }
  };

  const fetchCourseData = async () => {
    try {
      const [courseResponse, chaptersResponse] = await Promise.all([
        axios.get(`/api/courses/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`/api/courses/${id}/chapters`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setCourse(courseResponse.data.course);
      setChapters(chaptersResponse.data.chapters || []);
    } catch (error) {
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const quizData = {};
      for (const chapter of chapters) {
        const timestamp = Date.now();
        const response = await axios.get(`/api/quiz/chapter/${chapter.id}?cb=${timestamp}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache'
          }
        });
        quizData[chapter.id] = response.data.quizzes || [];
      }
      setChapterQuizzes(quizData);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const handleChapterSubmit = async () => {
    if (!chapterForm.title.trim()) {
      toast.error('Please enter chapter title');
      return;
    }

    try {
      if (editingChapter) {
        const response = await axios.put(`/api/chapters/${editingChapter}`, {
          title: chapterForm.title
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setChapters(prev => prev.map(chapter =>
          chapter.id === editingChapter ? { ...chapter, title: chapterForm.title } : chapter
        ));
        toast.success('Chapter updated successfully');
      } else {
        const response = await axios.post('/api/chapters', {
          courseId: id,
          title: chapterForm.title
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setChapters(prev => [...prev, { ...response.data.chapter, videos: [] }]);
        toast.success('Chapter added successfully');
      }
      
      setShowChapterModal(false);
      setChapterForm({ title: '' });
      setEditingChapter(null);
    } catch (error) {
      toast.error('Failed to save chapter');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/instructor/dashboard')}
              className="mr-4 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 theme-text-primary" />
            </button>
            <div>
              <h1 className="text-3xl font-bold theme-text-primary">{course?.title}</h1>
              <p className="theme-text-secondary">Build your course content</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => navigate(`/courses/${id}`)}>Preview Course</Button>
            <Button variant="outline" onClick={() => fetchCourseData()}>Sync Changes</Button>
            <Button onClick={async () => {
              try {
                const response = await axios.patch(`/api/courses/${id}/publish`, {}, {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                setCourse(prev => ({ ...prev, isPublished: response.data.course.isPublished }));
                toast.success(response.data.message);
                await fetchCourseData();
              } catch (error) {
                toast.error('Failed to update course status');
              }
            }}>
              {course?.isPublished ? 'Unpublish Course' : 'Publish Course'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="theme-card p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold theme-text-primary">Course Content</h2>
                <Button onClick={() => {
                  setChapterForm({ title: '' });
                  setEditingChapter(null);
                  setShowChapterModal(true);
                }} size="sm">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Add Chapter
                </Button>
              </div>

              <div className="space-y-4">
                {chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.id} className="border theme-border rounded-lg">
                    <div className="flex items-center justify-between p-4 theme-bg-secondary">
                      <div className="flex items-center space-x-3 flex-1">
                        <GripVertical className="w-4 h-4 theme-text-muted cursor-move" />
                        <span className="text-sm theme-text-muted">Chapter {chapterIndex + 1}</span>
                        <span className="flex-1 text-left theme-text-primary font-medium">
                          {chapter.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setChapterForm({ title: chapter.title });
                            setEditingChapter(chapter.id);
                            setShowChapterModal(true);
                          }}
                          title="Edit chapter"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (window.confirm('Delete this chapter and all its videos?')) {
                              try {
                                await axios.delete(`/api/chapters/${chapter.id}`, {
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                });
                                setChapters(prev => prev.filter(c => c.id !== chapter.id));
                                toast.success('Chapter deleted successfully');
                              } catch (error) {
                                toast.error('Failed to delete chapter');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete chapter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      {chapter.videos?.length === 0 && (
                        <div className="text-center py-8 theme-text-muted">
                          <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No content yet. Add videos, resources, or quizzes to this chapter.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {chapters.length === 0 && (
                  <div className="text-center py-12 theme-text-muted">
                    <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No chapters yet. Start building your course content.</p>
                    <Button onClick={() => {
                      setChapterForm({ title: '' });
                      setEditingChapter(null);
                      setShowChapterModal(true);
                    }}>Create First Chapter</Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="theme-card p-4 rounded-lg">
              <h3 className="font-semibold theme-text-primary mb-3">Course Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="theme-text-muted">Chapters:</span>
                  <span className="theme-text-primary">{chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-muted">Videos:</span>
                  <span className="theme-text-primary">
                    {chapters.reduce((sum, chapter) => sum + (chapter.videos?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Modal */}
        {showChapterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="theme-card p-6 rounded-lg w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold theme-text-primary">
                  {editingChapter ? 'Edit Chapter' : 'Add Chapter'}
                </h3>
                <button
                  onClick={() => setShowChapterModal(false)}
                  className="theme-text-muted hover:theme-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleChapterSubmit()}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter chapter title"
                    autoFocus
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowChapterModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChapterSubmit}
                    className="flex-1"
                  >
                    {editingChapter ? 'Update Chapter' : 'Add Chapter'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseBuilder;