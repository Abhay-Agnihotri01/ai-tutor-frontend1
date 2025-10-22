import { useState, useEffect } from 'react';
import { Clock, FileText, Palette, Eye, X, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ChapterNotes = ({ chapterId, courseId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const loadChapterNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notes/chapter/${chapterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to load chapter notes');
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-3 text-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  if (notes.length === 0) {
    return null;
  }

  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadChapterNotes();
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setDragPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    loadChapterNotes();
  }, [chapterId]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="mt-3 w-full p-3 theme-bg-tertiary rounded-lg border-l-4 border-blue-500 hover:theme-bg-secondary transition-colors text-left group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2 text-blue-600" />
            <h5 className="text-sm font-medium theme-text-primary">My Notes ({notes.length})</h5>
          </div>
          <Eye className="w-4 h-4 text-blue-600 group-hover:text-blue-800" />
        </div>
        
        <div className="space-y-1 max-h-20 overflow-hidden">
          {notes.slice(0, 2).map((note) => (
            <div key={note.id} className="flex items-center space-x-2">
              <Clock className="w-3 h-3 theme-text-muted" />
              <span className="text-xs theme-text-muted">{formatTime(note.timestamp)}</span>
              <span className="text-xs theme-text-secondary truncate flex-1">
                {note.type === 'text' ? note.content : '🎨 Drawing'}
              </span>
            </div>
          ))}
          {notes.length > 2 && (
            <p className="text-xs theme-text-muted">+{notes.length - 2} more notes</p>
          )}
        </div>
      </button>

      {/* Draggable Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-20" onClick={() => setModalOpen(false)} />
          <div
            className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border theme-border w-96 max-h-[80vh] overflow-hidden"
            style={{
              left: `${dragPosition.x}px`,
              top: `${dragPosition.y}px`,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Draggable Header */}
            <div
              className="flex items-center justify-between p-4 border-b theme-border cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold theme-text-primary">Chapter Notes ({notes.length})</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {notes.length === 0 ? (
                <p className="text-center theme-text-muted py-8">No notes in this chapter</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="theme-card p-3 rounded-lg border theme-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 theme-text-muted" />
                          <span className="text-sm theme-text-muted font-medium">
                            {formatTime(note.timestamp)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            note.type === 'text' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          }`}>
                            {note.type === 'text' ? '📝 Text' : '🎨 Drawing'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {note.type === 'text' ? (
                        <p className="theme-text-secondary leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </p>
                      ) : (
                        <div className="rounded-lg overflow-hidden border theme-border">
                          <img 
                            src={note.content} 
                            alt="Drawing" 
                            className="w-full h-auto" 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChapterNotes;