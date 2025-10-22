import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import PDFViewer from '../../components/common/PDFViewer';

const AssignmentSubmissions = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchSubmissions();
  }, [quizId]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to view submissions');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/quiz/submissions/${quizId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        // Get quiz info from first submission or fetch separately
        if (data.submissions.length > 0) {
          setQuiz({ 
            title: 'Assignment', 
            totalMarks: data.submissions[0].totalMarks || 100,
            courseId: data.submissions[0].courseId
          });
        }
      } else {
        throw new Error('Failed to fetch submissions');
      }
    } catch (error) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
              onClick={() => {
                // Close the current tab and return to the previous tab
                window.close();
              }}
              className="mr-4 p-2 hover:theme-bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 theme-text-primary" />
            </button>
            <div>
              <h1 className="text-3xl font-bold theme-text-primary">Assignment Submissions</h1>
              <p className="theme-text-secondary">{submissions.length} submissions received</p>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="theme-card rounded-lg overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="theme-text-muted">No submissions yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="theme-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium theme-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:theme-bg-secondary">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium theme-text-primary">
                          {submission.users?.firstName || 'Unknown'} {submission.users?.lastName || 'User'}
                        </div>
                        <div className="text-sm theme-text-muted">
                          {submission.users?.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm theme-text-primary">
                      {formatDate(submission.submittedAt)}
                    </td>
                    <td className="px-6 py-4">
                      {submission.fileUrl ? (
                        <span className="text-sm theme-text-primary">PDF File</span>
                      ) : (
                        <span className="text-sm theme-text-muted">No file</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {submission.score !== null ? (
                        <span className="text-sm theme-text-primary">
                          {submission.score}/{submission.totalMarks}
                        </span>
                      ) : (
                        <span className="text-sm theme-text-muted">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === 'graded' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {submission.status === 'graded' ? 'Graded' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                      {submission.fileUrl && (
                        <>
                          <button
                            onClick={() => navigate(`/instructor/grade/${submission.id}`, { 
                              state: { submission, quizId } 
                            })}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View & Grade
                          </button>
                          <a
                            href={`http://localhost:5000${submission.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </a>
                        </>
                      )}
                        <button
                          onClick={() => navigate(`/instructor/grade/${submission.id}`, { 
                            state: { submission, quizId } 
                          })}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                        >
                          {submission.status === 'graded' ? 'Edit Grade' : 'Grade'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>


      </div>
    </div>
  );
};

export default AssignmentSubmissions;