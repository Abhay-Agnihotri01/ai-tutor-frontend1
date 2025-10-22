import { useState, useEffect } from 'react';
import { X, Clock, FileText, Palette, Trash2, BookOpen, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AllNotesModal = ({ courseId, course, isOpen, onClose, inline = false, onJumpToTime }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupedNotes, setGroupedNotes] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadAllNotes();
    }
  }, [isOpen, courseId]);

  const loadAllNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load video notes
      const videoNotesResponse = await fetch(`http://localhost:5000/api/notes/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let allNotes = [];
      const seenNoteIds = new Set();
      
      if (videoNotesResponse.ok) {
        const videoData = await videoNotesResponse.json();
        const videoNotes = (videoData.notes || []).filter(note => {
          if (seenNoteIds.has(note.id)) return false;
          seenNoteIds.add(note.id);
          return true;
        });
        allNotes = [...allNotes, ...videoNotes];
      }
      
      // Try to load text lecture notes (may fail if column doesn't exist yet)
      try {
        const textNotesResponse = await fetch(`http://localhost:5000/api/notes/text-lecture/course/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (textNotesResponse.ok) {
          const textData = await textNotesResponse.json();
          // Add text lecture notes with a flag to distinguish them, avoiding duplicates
          const textNotes = (textData.notes || [])
            .filter(note => {
              if (seenNoteIds.has(note.id)) return false;
              seenNoteIds.add(note.id);
              return true;
            })
            .map(note => ({
              ...note,
              isTextLecture: true
            }));
          allNotes = [...allNotes, ...textNotes];
        }
      } catch (textError) {
        // Text lecture notes not available yet (column doesn't exist)
      }

      setNotes(allNotes);
      groupNotesByChapter(allNotes);
    } catch (error) {
      // Failed to load notes
    }
    setLoading(false);
  };

  const groupNotesByChapter = (notesData) => {
    const grouped = {};
    
    notesData.forEach(note => {
      let chapterData = null;
      
      if (note.videoId) {
        // Video note
        chapterData = findChapterAndVideo(note.videoId);
      } else if (note.textLectureId) {
        // Text lecture note
        chapterData = findChapterAndTextLecture(note.textLectureId);
      }
      
      if (chapterData) {
        const key = `${chapterData.chapter.id}-${chapterData.chapter.title}`;
        if (!grouped[key]) {
          grouped[key] = {
            chapter: chapterData.chapter,
            videos: {}
          };
        }
        
        const contentKey = note.videoId 
          ? `${chapterData.video.id}-${chapterData.video.title}`
          : `text-${chapterData.textLecture.id}-${chapterData.textLecture.title}`;
          
        if (!grouped[key].videos[contentKey]) {
          grouped[key].videos[contentKey] = {
            video: chapterData.video || null,
            textLecture: chapterData.textLecture || null,
            notes: []
          };
        }
        
        grouped[key].videos[contentKey].notes.push(note);
      }
    });
    
    setGroupedNotes(grouped);
  };

  const findChapterAndVideo = (videoId) => {
    if (!course?.chapters) return null;
    
    for (const chapter of course.chapters) {
      if (chapter.videos) {
        const video = chapter.videos.find(v => v.id === videoId);
        if (video) {
          return { chapter, video };
        }
      }
    }
    return null;
  };

  const findChapterAndTextLecture = (textLectureId) => {
    if (!course?.chapters) return null;
    
    for (const chapter of course.chapters) {
      if (chapter.textLectures || chapter.text_lectures) {
        const textLectures = chapter.textLectures || chapter.text_lectures;
        const textLecture = textLectures.find(t => t.id === textLectureId);
        if (textLecture) {
          return { chapter, textLecture };
        }
      }
    }
    return null;
  };

  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadAllNotes();
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  if (inline) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between p-4 border-b theme-border">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold theme-text-primary">My Notes</h2>
              <p className="text-xs theme-text-muted">{notes.length} notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:theme-bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 theme-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold theme-text-primary mb-2">No Notes Yet</h3>
              <p className="theme-text-muted">Start taking notes while watching videos</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotes).map(([chapterKey, chapterData]) => (
                <div key={chapterKey} className="border-l-4 border-blue-500 pl-4 mb-8">
                  <h3 className="text-base font-bold theme-text-primary mb-4 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 mr-3">
                      {course?.chapters?.findIndex(ch => ch.id === chapterData.chapter.id) + 1}
                    </span>
                    <span className="truncate">{chapterData.chapter.title}</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(chapterData.videos).map(([videoKey, videoData]) => (
                      <div key={videoKey}>
                        <h4 className="text-sm font-semibold theme-text-secondary mb-3 flex items-center">
                          {videoData.video ? (
                            <Play className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <FileText className="w-4 h-4 mr-2 text-blue-600" />
                          )}
                          <span className="truncate flex-1">
                            {videoData.video?.title || videoData.textLecture?.title || 'Unknown Content'}
                          </span>
                          <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs theme-text-muted">
                            {videoData.notes.length}
                          </span>
                        </h4>
                        
                        <div className="space-y-3 ml-6">
                          {videoData.notes.map((note, noteIndex) => (
                            <div key={`${note.id}-${noteIndex}`} className="theme-bg-secondary p-4 rounded-lg border theme-border group hover:shadow-md transition-all duration-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  {note.videoId ? (
                                    <button
                                      onClick={() => {
                                        if (onJumpToTime) {
                                          onJumpToTime(videoData.video.id, note.timestamp);
                                          toast.success(`Jumped to ${formatTime(note.timestamp)}`);
                                        }
                                      }}
                                      className="flex items-center space-x-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors group/time"
                                      title="Jump to this timestamp"
                                    >
                                      <Clock className="w-4 h-4 theme-text-muted group-hover/time:text-blue-600" />
                                      <span className="text-sm font-medium theme-text-muted group-hover/time:text-blue-600">
                                        {formatTime(note.timestamp)}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center space-x-1 px-2 py-1">
                                      <FileText className="w-4 h-4 theme-text-muted" />
                                      <span className="text-sm font-medium theme-text-muted">
                                        Text Lecture
                                      </span>
                                    </div>
                                  )}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    note.type === 'text' 
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                  }`}>
                                    {note.type === 'text' ? '📝 Text' : '🎨 Drawing'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {note.type === 'text' ? (
                                <p className="text-sm theme-text-primary leading-relaxed whitespace-pre-wrap">
                                  {note.content}
                                </p>
                              ) : (
                                <div className="rounded-lg overflow-hidden border theme-border bg-white">
                                  <img 
                                    src={note.content} 
                                    alt="Drawing" 
                                    className="w-full h-auto max-h-32 object-contain" 
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'bg-opacity-20' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b theme-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold theme-text-primary">My Notes</h2>
              <p className="text-xs theme-text-muted">{notes.length} notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-full pb-20">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 theme-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold theme-text-primary mb-2">No Notes Yet</h3>
              <p className="theme-text-muted">Start taking notes while watching videos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotes).map(([chapterKey, chapterData]) => (
                <div key={chapterKey} className="border-l-4 border-blue-500 pl-3 mb-6">
                  <h3 className="text-sm font-bold theme-text-primary mb-3 flex items-center">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 mr-2">
                      {course?.chapters?.findIndex(ch => ch.id === chapterData.chapter.id) + 1}
                    </span>
                    <span className="truncate">{chapterData.chapter.title}</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(chapterData.videos).map(([videoKey, videoData]) => (
                      <div key={videoKey}>
                        <h4 className="text-xs font-medium theme-text-secondary mb-2 flex items-center">
                          <Play className="w-3 h-3 mr-1 text-green-600" />
                          <span className="truncate flex-1">{videoData.video.title}</span>
                          <span className="ml-1 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs theme-text-muted">
                            {videoData.notes.length}
                          </span>
                        </h4>
                        
                        <div className="space-y-2 ml-4">
                          {videoData.notes.map((note, noteIndex) => (
                            <div key={`${note.id}-${noteIndex}-small`} className="theme-bg-secondary p-2 rounded border theme-border group hover:shadow-sm transition-shadow">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 theme-text-muted" />
                                  <span className="text-xs theme-text-muted">
                                    {formatTime(note.timestamp)}
                                  </span>
                                  <span className={`px-1 py-0.5 rounded text-xs ${
                                    note.type === 'text' 
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                                      : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                                  }`}>
                                    {note.type === 'text' ? '📝' : '🎨'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="text-red-500 hover:text-red-700 p-0.5 rounded transition-all"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              
                              {note.type === 'text' ? (
                                <p className="text-xs theme-text-secondary leading-relaxed line-clamp-3">
                                  {note.content}
                                </p>
                              ) : (
                                <div className="rounded overflow-hidden border theme-border">
                                  <img 
                                    src={note.content} 
                                    alt="Drawing" 
                                    className="w-full h-auto max-h-20 object-contain" 
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AllNotesModal;