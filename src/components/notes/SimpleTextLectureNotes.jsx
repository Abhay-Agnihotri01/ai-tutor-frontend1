import { useState, useEffect } from 'react';
import { Save, Edit3, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SimpleTextLectureNotes = ({ textLectureId, courseId, inline = false }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState({ isOpen: false, note: null });

  useEffect(() => {
    loadNotes();
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

  const saveNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notes', {
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

  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadNotes();
        setViewModal({ isOpen: false, note: null });
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error('Failed to delete note');
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

  return (
    <div className="w-full space-y-6">
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
                onClick={() => setViewModal({ isOpen: true, note })}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs theme-text-muted font-medium">
                    {formatDate(note.createdAt)}
                  </span>
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
          <Edit3 className="w-12 h-12 theme-text-muted mx-auto mb-3" />
          <p className="theme-text-muted">No notes yet. Add your first note above!</p>
        </div>
      )}

      {/* View Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b theme-border">
              <div>
                <h3 className="font-semibold theme-text-primary">Note</h3>
                <span className="text-sm theme-text-muted">
                  {formatDate(viewModal.note.createdAt)}
                </span>
              </div>
              <button
                onClick={() => setViewModal({ isOpen: false, note: null })}
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="theme-bg-secondary p-4 rounded-lg">
                <p className="theme-text-primary leading-relaxed whitespace-pre-wrap">
                  {viewModal.note.content}
                </p>
              </div>
            </div>
            <div className="p-4 border-t theme-border flex justify-end space-x-2">
              <button
                onClick={() => deleteNote(viewModal.note.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
              <button
                onClick={() => setViewModal({ isOpen: false, note: null })}
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
};

export default SimpleTextLectureNotes;