import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical, Play, Upload, Edit, Trash2, FolderPlus, X, HelpCircle, FileText, ChevronDown, Video, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import QuizBuilder from '../../components/quiz/QuizBuilder';
import QuizEditor from '../../components/quiz/QuizEditor';
import LiveClassScheduler from '../../components/live/LiveClassScheduler';
import NotificationCenter from '../../components/instructor/NotificationCenter';

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
      const response = await fetch(`http://localhost:5000/api/live-classes/course/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLiveClasses(data.liveClasses || []);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddDropdown && !event.target.closest('.add-content-dropdown')) {
        setShowAddDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddDropdown]);

  const fetchCourseData = async () => {
    try {
      const [courseResponse, chaptersResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/courses/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`http://localhost:5000/api/courses/${id}/chapters`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData.course);
      }
      
      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json();
        setChapters(chaptersData.chapters || []);
      }
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
        // Add cache busting to ensure fresh data
        const timestamp = Date.now();
        const response = await fetch(`http://localhost:5000/api/quiz/chapter/${chapter.id}?cb=${timestamp}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          quizData[chapter.id] = data.quizzes || [];
        }
      }
      setChapterQuizzes(quizData);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const addChapter = () => {
    setChapterForm({ title: '' });
    setEditingChapter(null);
    setShowChapterModal(true);
  };

  const handleChapterSubmit = async () => {
    if (!chapterForm.title.trim()) {
      toast.error('Please enter chapter title');
      return;
    }

    try {
      if (editingChapter) {
        // Update existing chapter
        const response = await fetch(`http://localhost:5000/api/chapters/${editingChapter}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: chapterForm.title })
        });
        
        if (response.ok) {
          setChapters(prev => prev.map(chapter =>
            chapter.id === editingChapter ? { ...chapter, title: chapterForm.title } : chapter
          ));
          toast.success('Chapter updated successfully');
        }
      } else {
        // Create new chapter
        const response = await fetch('http://localhost:5000/api/chapters', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            courseId: id,
            title: chapterForm.title
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setChapters(prev => [...prev, { ...data.chapter, videos: [] }]);
          toast.success('Chapter added successfully');
        }
      }
      
      setShowChapterModal(false);
      setChapterForm({ title: '' });
      setEditingChapter(null);
    } catch (error) {
      toast.error('Failed to save chapter');
    }
  };

  const editChapter = (chapterId, currentTitle) => {
    setChapterForm({ title: currentTitle });
    setEditingChapter(chapterId);
    setShowChapterModal(true);
  };

  const addVideo = (chapterId) => {
    setCurrentChapterId(chapterId);
    setVideoForm({ title: '', description: '', file: null });
    setEditingVideo(null);
    setShowVideoModal(true);
  };

  const addResource = (chapterId) => {
    setCurrentChapterId(chapterId);
    setResourceForm({ title: '', file: null });
    setEditingResource(null);
    setShowResourceModal(true);
  };

  const editResource = (chapterId, resourceId, currentTitle) => {
    setCurrentChapterId(chapterId);
    setResourceForm({ title: currentTitle, file: null });
    setEditingResource(resourceId);
    setShowResourceModal(true);
  };

  const editVideo = (chapterId, videoId, currentTitle, currentDescription = '') => {
    setCurrentChapterId(chapterId);
    setVideoForm({ title: currentTitle, description: currentDescription, file: null });
    setEditingVideo(videoId);
    setReplacingVideo(false);
    setShowVideoModal(true);
  };

  const replaceVideo = (chapterId, videoId, currentTitle, currentDescription = '') => {
    setCurrentChapterId(chapterId);
    setVideoForm({ title: currentTitle, description: currentDescription, file: null });
    setEditingVideo(videoId);
    setReplacingVideo(true);
    setShowVideoModal(true);
  };



  const updateVideoTitle = async (chapterId, videoId, title) => {
    try {
      const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      
      if (response.ok) {
        setChapters(prev => prev.map(chapter =>
          chapter.id === chapterId 
            ? {
                ...chapter,
                videos: chapter.videos.map(video =>
                  video.id === videoId ? { ...video, title } : video
                )
              }
            : chapter
        ));
      }
    } catch (error) {

    }
  };

  const deleteChapter = async (chapterId) => {
    if (window.confirm('Delete this chapter and all its videos?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/chapters/${chapterId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          setChapters(prev => prev.filter(chapter => chapter.id !== chapterId));
          toast.success('Chapter deleted successfully');
        } else {
          throw new Error('Failed to delete chapter');
        }
      } catch (error) {
        toast.error('Failed to delete chapter');
      }
    }
  };

  const handleResourceSubmit = async () => {
    if (!resourceForm.title.trim()) {
      toast.error('Please provide resource title');
      return;
    }

    if (!editingResource && !resourceForm.file) {
      toast.error('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      if (resourceForm.file) {
        formData.append('resource', resourceForm.file);
      }
      formData.append('title', resourceForm.title);
      
      if (!editingResource) {
        formData.append('chapterId', currentChapterId);
      }

      const url = editingResource 
        ? `http://localhost:5000/api/resources/${editingResource}`
        : 'http://localhost:5000/api/resources';
      
      const method = editingResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        if (editingResource) {
          // Update existing resource
          setChapters(prev => prev.map(chapter =>
            chapter.id === currentChapterId
              ? {
                  ...chapter,
                  resources: chapter.resources.map(resource =>
                    resource.id === editingResource ? data.resource : resource
                  )
                }
              : chapter
          ));
          toast.success('Resource updated successfully!');
        } else {
          // Add new resource
          setChapters(prev => prev.map(chapter =>
            chapter.id === currentChapterId
              ? { ...chapter, resources: [...(chapter.resources || []), data.resource] }
              : chapter
          ));
          toast.success('Resource uploaded successfully!');
        }
        
        setShowResourceModal(false);
        setResourceForm({ title: '', file: null });
        setEditingResource(null);
      } else {
        throw new Error('Operation failed');
      }
    } catch (error) {
      toast.error(editingResource ? 'Failed to update resource' : 'Failed to upload resource');
    }
  };

  const deleteResource = async (chapterId, resourceId) => {
    if (window.confirm('Delete this resource?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/resources/${resourceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          setChapters(prev => prev.map(chapter =>
            chapter.id === chapterId
              ? { ...chapter, resources: chapter.resources.filter(resource => resource.id !== resourceId) }
              : chapter
          ));
          toast.success('Resource deleted successfully');
        } else {
          throw new Error('Failed to delete resource');
        }
      } catch (error) {
        toast.error('Failed to delete resource');
      }
    }
  };

  const deleteVideo = async (chapterId, videoId) => {
    if (window.confirm('Delete this video?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/videos/${videoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          setChapters(prev => prev.map(chapter =>
            chapter.id === chapterId
              ? { ...chapter, videos: chapter.videos.filter(video => video.id !== videoId) }
              : chapter
          ));
          toast.success('Video deleted successfully');
        } else {
          throw new Error('Failed to delete video');
        }
      } catch (error) {
        toast.error('Failed to delete video');
      }
    }
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(Math.floor(video.duration));
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoSubmit = async () => {
    if (!videoForm.title.trim()) {
      toast.error('Please provide video title');
      return;
    }

    if (editingVideo) {
      // Update existing video
      if (replacingVideo && !videoForm.file) {
        toast.error('Please select a video file to replace');
        return;
      }
      
      if (videoForm.file) {
        // Replace video file
        
        setUploadingVideo(true);
        
        try {

          
          const duration = await getVideoDuration(videoForm.file);
          
          const formData = new FormData();
          formData.append('video', videoForm.file);
          formData.append('title', videoForm.title);
          formData.append('description', videoForm.description);
          formData.append('duration', duration.toString());
          

          

          
          const response = await fetch(`http://localhost:5000/api/videos/${editingVideo}/replace`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
              // DO NOT set Content-Type for FormData - browser sets it automatically
            },
            body: formData
          });
          

          
          if (response.ok) {
            const data = await response.json();
            setChapters(prev => prev.map(chapter =>
              chapter.id === currentChapterId
                ? {
                    ...chapter,
                    videos: chapter.videos.map(video =>
                      video.id === editingVideo ? data.video : video
                    )
                  }
                : chapter
            ));
            toast.success('Video replaced successfully!');
          } else {
            throw new Error('Replace failed');
          }
        } catch (error) {
          toast.error('Failed to replace video');
        } finally {
          setUploadingVideo(false);
        }
      } else {
        // Update only title
        try {
          const response = await fetch(`http://localhost:5000/api/videos/${editingVideo}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: videoForm.title, description: videoForm.description })
          });
          
          if (response.ok) {
            setChapters(prev => prev.map(chapter =>
              chapter.id === currentChapterId
                ? {
                    ...chapter,
                    videos: chapter.videos.map(video =>
                      video.id === editingVideo ? { ...video, title: videoForm.title } : video
                    )
                  }
                : chapter
            ));
            toast.success('Video updated successfully!');
          }
        } catch (error) {
          toast.error('Failed to update video');
        }
      }
      
      setShowVideoModal(false);
      setVideoForm({ title: '', description: '', file: null });
      setEditingVideo(null);
      setReplacingVideo(false);
    } else {
      // Create new video
      if (!videoForm.file) {
        toast.error('Please select a video file');
        return;
      }
      
      setUploadingVideo(true);
      
      try {
        const duration = await getVideoDuration(videoForm.file);
        
        const formData = new FormData();
        formData.append('video', videoForm.file);
        formData.append('chapterId', currentChapterId);
        formData.append('title', videoForm.title);
        formData.append('description', videoForm.description);
        formData.append('duration', duration.toString());
        
        const response = await fetch('http://localhost:5000/api/videos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setChapters(prev => prev.map(chapter =>
            chapter.id === currentChapterId
              ? { ...chapter, videos: [...(chapter.videos || []), data.video] }
              : chapter
          ));
          toast.success('Video uploaded successfully!');
          setShowVideoModal(false);
          setVideoForm({ title: '', description: '', file: null });
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        toast.error('Failed to upload video');
      } finally {
        setUploadingVideo(false);
      }
    }
  };
  


  const handleDragStart = (e, type, item, chapterId = null) => {
    setDraggedItem({ type, item, chapterId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetType, targetId, targetChapterId = null) => {
    e.preventDefault();
    
    if (!draggedItem) {
      return;
    };

    // Handle chapter reordering
    if (draggedItem.type === 'chapter' && targetType === 'chapter') {
      const draggedChapterId = typeof draggedItem.item === 'string' ? draggedItem.item : draggedItem.item.id;
      const draggedIndex = chapters.findIndex(c => c.id === draggedChapterId);
      const targetIndex = chapters.findIndex(c => c.id === targetId);
      
      if (draggedIndex === targetIndex) {
        setDraggedItem(null);
        return;
      }
      
      const newChapters = [...chapters];
      const [removed] = newChapters.splice(draggedIndex, 1);
      newChapters.splice(targetIndex, 0, removed);
      
      // Update order values
      const updatedChapters = newChapters.map((chapter, index) => ({
        ...chapter,
        order: index + 1
      }));
      
      setChapters(updatedChapters);
      
      // Save to backend
      try {
        await updateChapterOrder(updatedChapters);
      } catch (error) {
        toast.error('Failed to save chapter order');
        fetchCourseData(); // Revert on error
      }
    }
    
    // Handle mixed content reordering within same chapter (allow video-resource-text_lecture mixing)
    if ((draggedItem.type === 'video' || draggedItem.type === 'resource' || draggedItem.type === 'text_lecture') && 
        (targetType === 'video' || targetType === 'resource' || targetType === 'text_lecture') && 
        draggedItem.chapterId === targetChapterId) {
      
      setChapters(prev => prev.map(chapter => {
        if (chapter.id === targetChapterId) {
          // Combine videos, resources, and text lectures into one array with type info
          const allContent = [
            ...(chapter.videos || []).map(v => ({ ...v, contentType: 'video' })),
            ...(chapter.resources || []).map(r => ({ ...r, contentType: 'resource' })),
            ...(chapter.text_lectures || []).map(t => ({ ...t, contentType: 'text_lecture' }))
          ].sort((a, b) => a.order - b.order);
          
          const draggedItemId = typeof draggedItem.item === 'string' ? draggedItem.item : draggedItem.item.id;
          const draggedIndex = allContent.findIndex(item => item.id === draggedItemId);
          const targetIndex = allContent.findIndex(item => item.id === targetId);
          
          if (draggedIndex === targetIndex || draggedIndex === -1 || targetIndex === -1) {
            return chapter;
          }
          
          // Reorder the combined array
          const [removed] = allContent.splice(draggedIndex, 1);
          allContent.splice(targetIndex, 0, removed);
          
          // Update order values for all items in the new sequence
          const updatedContent = allContent.map((item, index) => ({
            ...item,
            order: index + 1
          }));
          
          // Separate back into videos, resources, and text lectures
          const updatedVideos = updatedContent.filter(item => item.contentType === 'video');
          const updatedResources = updatedContent.filter(item => item.contentType === 'resource');
          const updatedTextLectures = updatedContent.filter(item => item.contentType === 'text_lecture');
          
          // Save to backend - update videos, resources, and text lectures with new order
          Promise.all([
            updatedVideos.length > 0 ? updateVideoOrder(updatedVideos) : Promise.resolve(),
            updatedResources.length > 0 ? updateResourceOrder(updatedResources) : Promise.resolve(),
            updatedTextLectures.length > 0 ? updateTextLectureOrder(updatedTextLectures) : Promise.resolve()
          ]).catch((error) => {
            toast.error('Failed to save content order');
            fetchCourseData();
          });
          
          return { 
            ...chapter, 
            videos: updatedVideos,
            resources: updatedResources,
            text_lectures: updatedTextLectures
          };
        }
        return chapter;
      }));
    }
    
    setDraggedItem(null);
  };

  const updateChapterOrder = async (chapters) => {
    const updates = chapters.map(chapter => ({
      id: chapter.id,
      order: chapter.order
    }));
    
    await fetch('http://localhost:5000/api/chapters/reorder', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ chapters: updates })
    });
  };

  const updateResourceOrder = async (resources) => {
    const updates = resources.map(resource => ({
      id: resource.id,
      order: resource.order
    }));
    
    const response = await fetch('http://localhost:5000/api/resources/reorder', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resources: updates })
    });
    
    if (!response.ok) {
      throw new Error('Failed to reorder resources');
    }
  };

  const updateVideoOrder = async (videos) => {
    const updates = videos.map(video => ({
      id: video.id,
      order: video.order
    }));
    
    const response = await fetch('http://localhost:5000/api/videos/reorder', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videos: updates })
    });
    
    if (!response.ok) {
      throw new Error('Failed to reorder videos');
    }
  };

  const updateTextLectureOrder = async (textLectures) => {
    const updates = textLectures.map(textLecture => ({
      id: textLecture.id,
      order: textLecture.order
    }));
    
    const response = await fetch('http://localhost:5000/api/text-lectures/reorder', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ textLectures: updates })
    });
    
    if (!response.ok) {
      throw new Error('Failed to reorder text lectures');
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    const totalFiles = bulkFiles.length;
    let completedUploads = 0;

    for (const fileData of bulkFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 'uploading' }));
        
        const duration = await getVideoDuration(fileData.file);
        const formData = new FormData();
        formData.append('video', fileData.file);
        formData.append('chapterId', fileData.chapterId);
        formData.append('title', fileData.title);
        formData.append('duration', duration.toString());
        
        const response = await fetch('http://localhost:5000/api/videos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setChapters(prev => prev.map(chapter =>
            chapter.id === fileData.chapterId
              ? { ...chapter, videos: [...(chapter.videos || []), data.video] }
              : chapter
          ));
          setUploadProgress(prev => ({ ...prev, [fileData.id]: 'completed' }));
          completedUploads++;
        } else {
          setUploadProgress(prev => ({ ...prev, [fileData.id]: 'failed' }));
        }
      } catch (error) {
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 'failed' }));
      }
    }

    toast.success(`${completedUploads}/${totalFiles} videos uploaded successfully`);
    
    // Auto-sync after bulk upload
    setTimeout(() => {
      fetchCourseData();
      setShowBulkUploadModal(false);
      setBulkFiles([]);
      setUploadProgress({});
    }, 2000);
  };

  const addBulkFile = (file, chapterId) => {
    const fileData = {
      id: Date.now() + Math.random(),
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      chapterId
    };
    setBulkFiles(prev => [...prev, fileData]);
  };

  const removeBulkFile = (fileId) => {
    setBulkFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateBulkFileTitle = (fileId, title) => {
    setBulkFiles(prev => prev.map(f => f.id === fileId ? { ...f, title } : f));
  };

  const updateBulkFileChapter = (fileId, chapterId) => {
    setBulkFiles(prev => prev.map(f => f.id === fileId ? { ...f, chapterId } : f));
  };

  const handleCourseSettingsUpdate = async () => {
    if (!courseSettings.title.trim()) {
      toast.error('Course title is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', courseSettings.title);
      formData.append('shortDescription', courseSettings.shortDescription);
      formData.append('description', courseSettings.description);
      formData.append('category', courseSettings.category);
      formData.append('level', courseSettings.level);
      formData.append('price', courseSettings.price);
      formData.append('discountPrice', courseSettings.discountPrice);
      formData.append('language', courseSettings.language);
      
      if (courseSettings.thumbnail) {
        formData.append('thumbnail', courseSettings.thumbnail);
      }

      const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setShowCourseSettings(false);
        toast.success('Course settings updated successfully!');
      } else {
        throw new Error('Failed to update course');
      }
    } catch (error) {
      toast.error('Failed to update course settings');
    }
  };

  const categories = [
    'Programming', 'Design', 'Business', 'Marketing', 'Photography',
    'Music', 'Health & Fitness', 'Language', 'Personal Development', 'Other'
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Other'];

  const handlePreviewCourse = () => {
    navigate(`/courses/${id}`);
  };

  const handlePublishCourse = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourse(prev => ({ ...prev, isPublished: data.course.isPublished }));
        toast.success(data.message);
        // Refresh course data to ensure student side sees changes
        await fetchCourseData();
      } else {
        throw new Error('Failed to publish course');
      }
    } catch (error) {
      toast.error('Failed to update course status');
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
        {/* Header */}
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
            <Button variant="outline" onClick={handlePreviewCourse}>Preview Course</Button>
            <Button variant="outline" onClick={() => fetchCourseData()}>Sync Changes</Button>
            <Button onClick={handlePublishCourse}>
              {course?.isPublished ? 'Unpublish Course' : 'Publish Course'}
            </Button>
          </div>
        </div>

        {/* Course Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Structure */}
          <div className="lg:col-span-3">
            <div className="theme-card p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold theme-text-primary">Course Content</h2>
                <Button onClick={addChapter} size="sm">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Add Chapter
                </Button>
              </div>

              <div className="space-y-4">
                {chapters.map((chapter, chapterIndex) => (
                  <div
                    key={chapter.id}
                    className="border theme-border rounded-lg"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'chapter', chapter)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'chapter', chapter.id)}
                  >
                    {/* Chapter Header */}
                    <div className="flex items-center justify-between p-4 theme-bg-secondary">
                      <div className="flex items-center space-x-3 flex-1">
                        <GripVertical className="w-4 h-4 theme-text-muted cursor-move" />
                        <span className="text-sm theme-text-muted">Chapter {chapterIndex + 1}</span>
                        <button
                          onClick={() => editChapter(chapter.id, chapter.title)}
                          className="flex-1 text-left theme-text-primary font-medium hover:theme-text-secondary transition-colors"
                        >
                          {chapter.title}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Add Content Dropdown */}
                        <div className="relative add-content-dropdown">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddDropdown(showAddDropdown === chapter.id ? null : chapter.id)}
                            className="flex items-center space-x-1"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Content</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showAddDropdown === chapter.id ? 'rotate-180' : ''}`} />
                          </Button>
                          
                          {showAddDropdown === chapter.id && (
                            <div className="absolute top-full left-0 mt-1 w-48 theme-card border theme-border rounded-lg shadow-lg z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    addVideo(chapter.id);
                                    setShowAddDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:theme-bg-secondary flex items-center space-x-2 theme-text-primary transition-colors"
                                >
                                  <Play className="w-4 h-4 text-blue-500" />
                                  <span>Video Lecture</span>
                                </button>
                                <button
                                  onClick={() => {
                                    navigate(`/instructor/text-lecture/create?chapterId=${chapter.id}&courseId=${id}`);
                                    setShowAddDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:theme-bg-secondary flex items-center space-x-2 theme-text-primary transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-green-500" />
                                  <span>Text Lecture</span>
                                </button>
                                <button
                                  onClick={() => {
                                    addResource(chapter.id);
                                    setShowAddDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:theme-bg-secondary flex items-center space-x-2 theme-text-primary transition-colors"
                                >
                                  <Upload className="w-4 h-4 text-purple-500" />
                                  <span>Resource File</span>
                                </button>
                                <hr className="my-1 theme-border" />
                                <button
                                  onClick={() => {
                                    setSelectedChapterForQuiz(chapter.id);
                                    setShowQuizBuilder(true);
                                    setShowAddDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:theme-bg-secondary flex items-center space-x-2 theme-text-primary transition-colors"
                                >
                                  <HelpCircle className="w-4 h-4 text-orange-500" />
                                  <span>Quiz/Assignment</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedChapterForLiveClass(chapter.id);
                                    setShowLiveClassScheduler(true);
                                    setShowAddDropdown(null);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:theme-bg-secondary flex items-center space-x-2 theme-text-primary transition-colors"
                                >
                                  <Video className="w-4 h-4 text-red-500" />
                                  <span>Live Class</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Chapter Actions */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editChapter(chapter.id, chapter.title)}
                          title="Edit chapter"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteChapter(chapter.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete chapter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mixed Content (Videos and Resources) */}
                    <div className="p-4 space-y-2">
                      {/* Combine and sort videos, resources, and text lectures by order */}
                      {[
                        ...(chapter.videos || []).map(v => ({ ...v, contentType: 'video' })),
                        ...(chapter.resources || []).map(r => ({ ...r, contentType: 'resource' })),
                        ...(chapter.text_lectures || []).map(t => ({ ...t, contentType: 'text_lecture' }))
                      ]
                      .sort((a, b) => a.order - b.order)
                      .map((item) => {
                        if (item.contentType === 'video') {
                          return (
                            <div
                              key={`video-${item.id}`}
                              className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg"
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, 'video', item, chapter.id);
                              }}
                              onDragOver={(e) => {
                                e.stopPropagation();
                                handleDragOver(e);
                              }}
                              onDrop={(e) => {
                                e.stopPropagation();
                                handleDrop(e, 'video', item.id, chapter.id);
                              }}
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <GripVertical className="w-4 h-4 theme-text-muted cursor-move" />
                                {item.thumbnailUrl ? (
                                  <img 
                                    src={`http://localhost:5000${item.thumbnailUrl}`}
                                    alt={item.title}
                                    className="w-8 h-6 rounded object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                ) : null}
                                <Play className="w-4 h-4 theme-text-muted" style={{display: item.thumbnailUrl ? 'none' : 'block'}} />
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateVideoTitle(chapter.id, item.id, e.target.value)}
                                  className="flex-1 bg-transparent border-none focus:outline-none theme-text-primary"
                                />
                                <span className="text-sm theme-text-muted">
                                  {item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => replaceVideo(chapter.id, item.id, item.title, item.description)}
                                  title="Replace video"
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => editVideo(chapter.id, item.id, item.title, item.description)}
                                  title="Edit video"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteVideo(chapter.id, item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        } else if (item.contentType === 'resource') {
                          return (
                            <div
                              key={`resource-${item.id}`}
                              className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg border-l-4 border-green-500"
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, 'resource', item, chapter.id);
                              }}
                              onDragOver={(e) => {
                                e.stopPropagation();
                                handleDragOver(e);
                              }}
                              onDrop={(e) => {
                                e.stopPropagation();
                                handleDrop(e, 'resource', item.id, chapter.id);
                              }}
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <GripVertical className="w-4 h-4 theme-text-muted cursor-move" />
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                                  <span className="text-green-600 text-xs font-bold">📄</span>
                                </div>
                                <div className="flex-1">
                                  <p className="theme-text-primary font-medium">{item.title}</p>
                                  <p className="text-xs theme-text-muted">
                                    {item.fileName} • {(item.fileSize / 1024 / 1024).toFixed(1)}MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => editResource(chapter.id, item.id, item.title)}
                                  title="Edit resource"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteResource(chapter.id, item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        } else {
                          // Text lecture
                          return (
                            <div
                              key={`text-lecture-${item.id}`}
                              className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg border-l-4 border-blue-500"
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, 'text_lecture', item, chapter.id);
                              }}
                              onDragOver={(e) => {
                                e.stopPropagation();
                                handleDragOver(e);
                              }}
                              onDrop={(e) => {
                                e.stopPropagation();
                                handleDrop(e, 'text_lecture', item.id, chapter.id);
                              }}
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <GripVertical className="w-4 h-4 theme-text-muted cursor-move" />
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="theme-text-primary font-medium">{item.title}</p>
                                  <p className="text-xs theme-text-muted">
                                    {item.uploadType === 'url' ? 'Web Content' : item.fileName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (item.uploadType === 'url') {
                                      window.open(item.filePath, '_blank');
                                    } else {
                                      window.open(`http://localhost:5000${item.filePath}`, '_blank');
                                    }
                                  }}
                                  title="View text lecture"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (window.confirm('Delete this text lecture?')) {
                                      try {
                                        const response = await fetch(`http://localhost:5000/api/text-lectures/${item.id}`, {
                                          method: 'DELETE',
                                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                        });
                                        if (response.ok) {
                                          await fetchCourseData();
                                          toast.success('Text lecture deleted successfully');
                                        }
                                      } catch (error) {
                                        toast.error('Failed to delete text lecture');
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        }
                      })}

                      {/* Chapter Quizzes */}
                      {chapterQuizzes[chapter.id]?.map((quiz) => (
                        <div
                          key={`quiz-${quiz.id}`}
                          className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg border-l-4 border-blue-500"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">📝</span>
                            </div>
                            <div className="flex-1">
                              <p className="theme-text-primary font-medium">{quiz.title}</p>
                              <p className="text-xs theme-text-muted">
                                {quiz.type === 'quiz' ? 'Quiz' : 'Assignment'} • 
                                {quiz.isReady ? `${quiz.totalMarks} marks` : 'Not ready'}
                                {quiz.type === 'quiz' ? ` • ${quiz.questions?.length || 0} questions` : ''}
                                {quiz.type === 'assignment' && quiz.submissionStats ? (
                                  ` • ${quiz.submissionStats.totalSubmissions} submissions • ${quiz.submissionStats.totalGraded} graded • ${quiz.submissionStats.pendingGrading} pending`
                                ) : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {quiz.type === 'assignment' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.open(`/instructor/submissions/${quiz.id}`, '_blank');
                                }}
                                title="View submissions"
                              >
                                📄 Submissions
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingQuizId(quiz.id);
                                setShowQuizEditor(true);
                              }}
                              title="Edit quiz"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (window.confirm('Delete this quiz?')) {
                                  try {
                                    const response = await fetch(`http://localhost:5000/api/quiz/quizzes/${quiz.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                    });
                                    if (response.ok) {
                                      await fetchQuizzes();
                                      toast.success('Quiz deleted successfully');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to delete quiz');
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {(chapter.videos.length === 0 && (!chapter.resources || chapter.resources.length === 0) && (!chapterQuizzes[chapter.id] || chapterQuizzes[chapter.id].length === 0)) && (
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
                    <Button onClick={addChapter}>Create First Chapter</Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                    {chapters.reduce((sum, chapter) => sum + chapter.videos.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-text-muted">Duration:</span>
                  <span className="theme-text-primary">
                    {(() => {
                      const totalSeconds = chapters.reduce((sum, chapter) => 
                        sum + (chapter.videos || []).reduce((videoSum, video) => videoSum + (video.duration || 0), 0), 0
                      );
                      const minutes = Math.floor(totalSeconds / 60);
                      const seconds = totalSeconds % 60;
                      
                      if (minutes > 0) {
                        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
                      } else {
                        return `${seconds}s`;
                      }
                    })()} 
                  </span>
                </div>
              </div>
            </div>

            {/* Live Classes Section */}
            <div className="theme-card p-4 rounded-lg">
              <h3 className="font-semibold theme-text-primary mb-3 flex items-center">
                <Video className="w-4 h-4 mr-2 text-red-500" />
                Live Classes ({liveClasses.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {liveClasses.length > 0 ? (
                  liveClasses.map((liveClass) => {
                    const scheduledDate = new Date(liveClass.scheduledAt);
                    const isUpcoming = scheduledDate > new Date();
                    const isLive = liveClass.status === 'live';
                    
                    return (
                      <div key={liveClass.id} className="p-3 theme-bg-secondary rounded-lg border theme-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium theme-text-primary truncate">{liveClass.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isLive ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            isUpcoming ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {isLive ? '🔴 LIVE' : liveClass.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs theme-text-muted mb-2">
                          {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex space-x-1">
                          {liveClass.status === 'scheduled' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`http://localhost:5000/api/live-classes/${liveClass.id}/start`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                  });
                                  if (response.ok) {
                                    await fetchLiveClasses();
                                    window.open(liveClass.meetingUrl, '_blank');
                                    toast.success('Live class started!');
                                  }
                                } catch (error) {
                                  toast.error('Failed to start live class');
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-xs"
                            >
                              Start Meeting
                            </Button>
                          )}
                          {isLive && (
                            <Button
                              size="sm"
                              onClick={() => window.open(liveClass.meetingUrl, '_blank')}
                              className="bg-red-600 hover:bg-red-700 text-xs"
                            >
                              Join Live
                            </Button>
                          )}
                          {isLive && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`http://localhost:5000/api/live-classes/${liveClass.id}/end`, {
                                    method: 'PATCH',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                  });
                                  if (response.ok) {
                                    await fetchLiveClasses();
                                    toast.success('Live class ended');
                                  }
                                } catch (error) {
                                  toast.error('Failed to end live class');
                                }
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-xs"
                            >
                              End Meeting
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (window.confirm('Delete this live class?')) {
                                try {
                                  const response = await fetch(`http://localhost:5000/api/live-classes/${liveClass.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                  });
                                  if (response.ok) {
                                    await fetchLiveClasses();
                                    toast.success('Live class deleted successfully');
                                  }
                                } catch (error) {
                                  toast.error('Failed to delete live class');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm theme-text-muted text-center py-4">No live classes scheduled</p>
                )}
              </div>
            </div>

            <div className="theme-card p-4 rounded-lg">
              <h3 className="font-semibold theme-text-primary mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowBulkUploadModal(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    setCourseSettings({
                      title: course?.title || '',
                      shortDescription: course?.shortDescription || '',
                      description: course?.description || '',
                      category: course?.category || '',
                      level: course?.level || '',
                      price: course?.price || '',
                      discountPrice: course?.discountPrice || '',
                      language: course?.language || '',
                      thumbnail: null
                    });
                    setShowCourseSettings(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Course Settings
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowNotificationCenter(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
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

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="theme-card p-6 rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold theme-text-primary">Bulk Upload Videos</h3>
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  className="theme-text-muted hover:theme-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* File Drop Zone */}
                <div className="border-2 border-dashed theme-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const defaultChapter = chapters[0]?.id;
                      files.forEach(file => addBulkFile(file, defaultChapter));
                    }}
                    className="hidden"
                    id="bulk-upload"
                  />
                  <label htmlFor="bulk-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 theme-text-muted mx-auto mb-4" />
                    <p className="theme-text-primary font-medium mb-2">Click to select videos</p>
                    <p className="theme-text-muted text-sm">Select multiple video files to upload</p>
                  </label>
                </div>

                {/* File List */}
                {bulkFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium theme-text-primary">Selected Files ({bulkFiles.length})</h4>
                    {bulkFiles.map((fileData) => (
                      <div key={fileData.id} className="flex items-center space-x-3 p-3 theme-bg-secondary rounded-lg">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={fileData.title}
                            onChange={(e) => updateBulkFileTitle(fileData.id, e.target.value)}
                            className="px-2 py-1 theme-bg-tertiary theme-text-primary border theme-border rounded text-sm"
                            placeholder="Video title"
                          />
                          <select
                            value={fileData.chapterId || ''}
                            onChange={(e) => updateBulkFileChapter(fileData.id, e.target.value)}
                            className="px-2 py-1 theme-bg-tertiary theme-text-primary border theme-border rounded text-sm"
                          >
                            <option value="">Select Chapter</option>
                            {chapters.map(chapter => (
                              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                            ))}
                          </select>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs theme-text-muted">{(fileData.file.size / 1024 / 1024).toFixed(1)}MB</span>
                            {uploadProgress[fileData.id] === 'uploading' && (
                              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {uploadProgress[fileData.id] === 'completed' && (
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            {uploadProgress[fileData.id] === 'failed' && (
                              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✗</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeBulkFile(fileData.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkUploadModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkUpload}
                    disabled={bulkFiles.length === 0 || Object.values(uploadProgress).some(status => status === 'uploading')}
                    className="flex-1"
                  >
                    {Object.values(uploadProgress).some(status => status === 'uploading') 
                      ? 'Uploading...' 
                      : `Upload ${bulkFiles.length} Videos`
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Settings Modal */}
        {showCourseSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="theme-card p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold theme-text-primary">Course Settings</h3>
                <button
                  onClick={() => setShowCourseSettings(false)}
                  className="theme-text-muted hover:theme-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={courseSettings.title}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter course title"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={courseSettings.shortDescription}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, shortDescription: e.target.value }))}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Brief description for course cards"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Full Description
                    </label>
                    <textarea
                      value={courseSettings.description}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Detailed course description"
                    />
                  </div>
                </div>

                {/* Course Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Category
                    </label>
                    <select
                      value={courseSettings.category}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={courseSettings.level}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, level: e.target.value }))}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Level</option>
                      {levels.map(level => (
                        <option key={level} value={level.toLowerCase()}>{level}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Discount Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={courseSettings.discountPrice}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, discountPrice: e.target.value }))}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={courseSettings.price}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">
                      Language
                    </label>
                    <select
                      value={courseSettings.language}
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Language</option>
                      {languages.map(lang => (
                        <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Course Thumbnail
                  </label>
                  <div className="flex items-center space-x-4">
                    {course?.thumbnail && (
                      <img 
                        src={`http://localhost:5000${course.thumbnail}`}
                        alt="Current thumbnail"
                        className="w-20 h-12 object-cover rounded border theme-border"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCourseSettings(prev => ({ ...prev, thumbnail: e.target.files[0] }))}
                      className="flex-1 px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs theme-text-muted mt-1">Recommended: 400x225px, max 5MB</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t theme-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowCourseSettings(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCourseSettingsUpdate}
                    className="flex-1"
                  >
                    Update Course Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resource Upload Modal */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="theme-card p-6 rounded-lg w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold theme-text-primary">
                  {editingResource ? 'Edit Resource' : 'Add Resource'}
                </h3>
                <button
                  onClick={() => setShowResourceModal(false)}
                  className="theme-text-muted hover:theme-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter resource title"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    File
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.md"
                    onChange={(e) => setResourceForm(prev => ({ ...prev, file: e.target.files[0] }))}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs theme-text-muted mt-1">
                    {editingResource ? 'Leave empty to keep current file. ' : ''}Supported: PDF, DOC, PPT, XLS, ZIP, TXT (Max 10MB)
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowResourceModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResourceSubmit}
                    className="flex-1"
                  >
                    {editingResource ? 'Update Resource' : 'Upload Resource'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Builder Modal */}
        {showQuizBuilder && (
          <QuizBuilder
            isOpen={showQuizBuilder}
            onClose={() => {
              setShowQuizBuilder(false);
              setSelectedChapterForQuiz(null);
            }}
            chapterId={selectedChapterForQuiz}
            videos={chapters.find(c => c.id === selectedChapterForQuiz)?.videos || []}
            onQuizCreated={async () => {
              await fetchCourseData();
              await fetchQuizzes();
              setShowQuizBuilder(false);
              setSelectedChapterForQuiz(null);
              toast.success('Quiz created successfully! It will be visible to students.');
            }}
          />
        )}

        {/* Quiz Editor Modal */}
        {showQuizEditor && (
          <QuizEditor
            isOpen={showQuizEditor}
            onClose={() => {
              setShowQuizEditor(false);
              setEditingQuizId(null);
            }}
            quizId={editingQuizId}
            onQuizUpdated={async () => {
              // Force refresh quiz data
              await fetchQuizzes();
              setShowQuizEditor(false);
              setEditingQuizId(null);
              toast.success('Quiz updated successfully!');
            }}
          />
        )}

        {/* Live Class Scheduler Modal */}
        {showLiveClassScheduler && (
          <LiveClassScheduler
            isOpen={showLiveClassScheduler}
            onClose={() => {
              setShowLiveClassScheduler(false);
              setSelectedChapterForLiveClass(null);
            }}
            courseId={id}
            chapterId={selectedChapterForLiveClass}
            onScheduled={async () => {
              await fetchCourseData();
              await fetchLiveClasses();
              setShowLiveClassScheduler(false);
              setSelectedChapterForLiveClass(null);
            }}
          />
        )}

        {/* Notification Center Modal */}
        {showNotificationCenter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="bg-white rounded-lg shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                  <button
                    onClick={() => setShowNotificationCenter(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto">
                  <NotificationCenter 
                    courseId={id} 
                    courseName={course?.title}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Upload Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="theme-card p-6 rounded-lg w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold theme-text-primary">
                  {editingVideo ? (replacingVideo ? 'Replace Video' : 'Edit Video') : 'Add Video'}
                </h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="theme-text-muted hover:theme-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Video Title
                  </label>
                  <input
                    type="text"
                    value={videoForm.title}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter video title"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Lecture Notes (Optional)
                  </label>
                  <textarea
                    value={videoForm.description}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Add lecture notes, key points, or additional resources for students..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Video File
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoForm(prev => ({ ...prev, file: e.target.files[0] }))}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {editingVideo && !replacingVideo && !videoForm.file && (
                    <p className="text-xs theme-text-muted mt-1">
                      Leave empty to keep current video file
                    </p>
                  )}
                  {replacingVideo && (
                    <p className="text-xs theme-text-muted mt-1">
                      Select a new video file to replace the current one
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowVideoModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVideoSubmit}
                    disabled={uploadingVideo}
                    className="flex-1"
                  >
                    {uploadingVideo ? 'Processing...' : editingVideo ? (replacingVideo ? 'Replace Video' : 'Update Video') : 'Upload Video'}
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