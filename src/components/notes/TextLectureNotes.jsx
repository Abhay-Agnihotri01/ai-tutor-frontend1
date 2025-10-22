import { useState, useEffect } from 'react';
import { Save, Edit3, Bookmark, BookmarkCheck, Trash2, Eye, X, Plus, Highlighter, StickyNote, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TextLectureNotes = ({ textLectureId, courseId, inline = false, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('notes');
  const [newNote, setNewNote] = useState('');
  const [newBookmark, setNewBookmark] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState({ isOpen: false, item: null, type: null });
  const [showAddBookmark, setShowAddBookmark] = useState(false);

  useEffect(() => {
    loadNotes();
    loadBookmarks();
  }, [textLectureId]);

  const loadNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notes/text-lecture/${textLectureId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      // Failed to load notes
    }
  };

  const loadBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/bookmarks/text-lecture/${textLectureId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch (error) {
      // Failed to load bookmarks
    }
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notes/text-lecture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          textLectureId,
          courseId,
          content: newNote,
          type: 'text'
        })
      });

      if (response.ok) {
        setNewNote('');
        loadNotes();
        toast.success('Note saved!');
      }
    } catch (error) {
      toast.error('Failed to save note');
    }
    setLoading(false);
  };

  const saveBookmark = async () => {
    if (!newBookmark.title.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookmarks/text-lecture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          textLectureId,
          courseId,
          title: newBookmark.title,
          description: newBookmark.description
        })
      });

      if (response.ok) {
        setNewBookmark({ title: '', description: '' });
        setShowAddBookmark(false);
        loadBookmarks();
        toast.success('Bookmark saved!');
      }
    } catch (error) {
      toast.error('Failed to save bookmark');
    }
    setLoading(false);
  };

  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notes/text-lecture/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadNotes();
        setViewModal({ isOpen: false, item: null, type: null });
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const deleteBookmark = async (bookmarkId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bookmarks/text-lecture/${bookmarkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadBookmarks();
        setViewModal({ isOpen: false, item: null, type: null });
        toast.success('Bookmark deleted');
      }
    } catch (error) {
      toast.error('Failed to delete bookmark');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (inline) {
    return (
      <div className="w-full">
        {/* Tab Navigation */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
              activeTab === 'notes' 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'theme-bg-secondary theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary'
            }`}
          >
            <StickyNote className="w-4 h-4 mr-2" />
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
              activeTab === 'bookmarks' 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'theme-bg-secondary theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary'
            }`}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Bookmarks ({bookmarks.length})
          </button>
        </div>

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Add New Note */}
            <div className="theme-bg-secondary p-4 rounded-lg">
              <h4 className="font-semibold theme-text-primary mb-3 flex items-center">
                <Edit3 className="w-4 h-4 mr-2" />
                Add Note
              </h4>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your thoughts about this text lecture..."
                className="w-full h-32 p-4 theme-card border theme-border rounded-lg text-sm resize-y theme-text-primary placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={saveNote}
                  disabled={loading || !newNote.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>

            {/* Notes List */}
            {notes.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold theme-text-primary">My Notes ({notes.length})</h4>
                <div className="grid gap-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="theme-card p-4 rounded-lg border theme-border hover:shadow-md transition-all group cursor-pointer"
                      onClick={() => setViewModal({ isOpen: true, item: note, type: 'note' })}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <StickyNote className="w-4 h-4 text-blue-500" />
                          <span className="text-xs theme-text-muted font-medium">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <Eye className="w-4 h-4 theme-text-muted group-hover:text-primary-500" />
                      </div>
                      <p className="text-sm theme-text-primary line-clamp-3 leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 theme-bg-secondary rounded-lg">
                <StickyNote className="w-12 h-12 theme-text-muted mx-auto mb-3" />
                <p className="theme-text-muted">No notes yet. Add your first note above!</p>
              </div>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-6">
            {/* Add New Bookmark */}
            <div className="theme-bg-secondary p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold theme-text-primary flex items-center">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Quick Bookmark
                </h4>
                <button
                  onClick={() => setShowAddBookmark(!showAddBookmark)}
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {showAddBookmark ? 'Cancel' : 'Add Bookmark'}
                </button>
              </div>
              
              {showAddBookmark && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Bookmark title (e.g., 'Important concept')"
                    className="w-full p-3 theme-card border theme-border rounded-lg text-sm theme-text-primary placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <textarea
                    value={newBookmark.description}
                    onChange={(e) => setNewBookmark(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description or key points..."
                    className="w-full h-24 p-3 theme-card border theme-border rounded-lg text-sm resize-y theme-text-primary placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={saveBookmark}
                      disabled={loading || !newBookmark.title.trim()}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition-colors flex items-center"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Bookmark'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bookmarks List */}
            {bookmarks.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold theme-text-primary">My Bookmarks ({bookmarks.length})</h4>
                <div className="grid gap-3">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="theme-card p-4 rounded-lg border-l-4 border-yellow-500 hover:shadow-md transition-all group cursor-pointer"
                      onClick={() => setViewModal({ isOpen: true, item: bookmark, type: 'bookmark' })}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <BookmarkCheck className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs theme-text-muted font-medium">
                            {formatDate(bookmark.createdAt)}
                          </span>
                        </div>
                        <Eye className="w-4 h-4 theme-text-muted group-hover:text-primary-500" />
                      </div>
                      <h5 className="font-medium theme-text-primary mb-1">{bookmark.title}</h5>
                      {bookmark.description && (
                        <p className="text-sm theme-text-secondary line-clamp-2 leading-relaxed">
                          {bookmark.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 theme-bg-secondary rounded-lg">
                <Bookmark className="w-12 h-12 theme-text-muted mx-auto mb-3" />
                <p className="theme-text-muted">No bookmarks yet. Mark important sections!</p>
              </div>
            )}
          </div>
        )}

        {/* View Modal */}
        {viewModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b theme-border">
                <div className="flex items-center space-x-2">
                  {viewModal.type === 'note' ? (
                    <StickyNote className="w-5 h-5 text-blue-500" />
                  ) : (
                    <BookmarkCheck className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="font-semibold theme-text-primary">
                      {viewModal.type === 'note' ? 'Note' : viewModal.item.title}
                    </h3>
                    <span className="text-sm theme-text-muted">
                      {formatDate(viewModal.item.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal({ isOpen: false, item: null, type: null })}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="theme-bg-secondary p-4 rounded-lg">
                  <p className="theme-text-primary leading-relaxed whitespace-pre-wrap">
                    {viewModal.type === 'note' ? viewModal.item.content : viewModal.item.description || 'No description provided.'}
                  </p>
                </div>
              </div>
              <div className="p-4 border-t theme-border flex justify-end space-x-2">
                <button
                  onClick={() => viewModal.type === 'note' ? deleteNote(viewModal.item.id) : deleteBookmark(viewModal.item.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
                <button
                  onClick={() => setViewModal({ isOpen: false, item: null, type: null })}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null; // Non-inline mode not implemented for text lectures
};

export default TextLectureNotes;