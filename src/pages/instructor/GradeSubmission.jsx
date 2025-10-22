import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';

const GradeSubmission = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [quizId, setQuizId] = useState(null);

  useEffect(() => {
    // Check if submission data was passed through navigation state
    if (location.state?.submission) {
      setSubmission(location.state.submission);
      setQuizId(location.state.quizId);
      setGradeForm({
        score: location.state.submission.score || '',
        feedback: location.state.submission.feedback || ''
      });
      setLoading(false);
    } else {
      // Fallback: redirect back if no data provided
      toast.error('No submission data found');
      navigate(-1);
    }
  }, [location.state, navigate]);

  const submitGrade = async () => {
    if (!gradeForm.score || gradeForm.score < 0) {
      toast.error('Please enter a valid score');
      return;
    }

    setGrading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/quiz/grade/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: parseInt(gradeForm.score),
          feedback: gradeForm.feedback
        })
      });

      if (response.ok) {
        toast.success('Grade submitted successfully!');
        navigate(`/instructor/submissions/${quizId}`); // Go back to submissions page
      } else {
        throw new Error('Failed to submit grade');
      }
    } catch (error) {
      toast.error('Failed to submit grade');
    } finally {
      setGrading(false);
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

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold theme-text-primary mb-2">Submission not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-primary">
      {/* Header */}
      <div className="theme-bg-secondary border-b theme-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:theme-bg-tertiary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 theme-text-primary" />
              </button>
              <div>
                <h1 className="text-2xl font-bold theme-text-primary">
                  Grade Submission
                </h1>
                <p className="theme-text-secondary">
                  {submission.users?.firstName} {submission.users?.lastName} • 
                  Submitted: {formatDate(submission.submittedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {submission.fileUrl && (
                <a
                  href={`http://localhost:5000${submission.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium theme-text-primary hover:theme-bg-tertiary"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <div className="theme-card rounded-lg overflow-hidden h-[800px]">
              <div className="h-full">
                {submission.fileUrl ? (
                  <iframe
                    src={`http://localhost:5000${submission.fileUrl}`}
                    className="w-full h-full border-0"
                    title="Student Submission"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="theme-text-muted">No file submitted</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grading Panel */}
          <div className="lg:col-span-1">
            <div className="theme-card p-6 rounded-lg">
              <h3 className="text-lg font-semibold theme-text-primary mb-4">
                Grade Assignment
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Student Information
                  </label>
                  <div className="theme-bg-secondary p-3 rounded-lg">
                    <p className="font-medium theme-text-primary">
                      {submission.users?.firstName} {submission.users?.lastName}
                    </p>
                    <p className="text-sm theme-text-muted">
                      {submission.users?.email}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Score (out of {submission.totalMarks})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={submission.totalMarks}
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter score"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Provide feedback to the student..."
                  />
                </div>

                {submission.score !== null && (
                  <div className="theme-bg-secondary p-3 rounded-lg">
                    <p className="text-sm theme-text-muted mb-1">Current Grade:</p>
                    <p className="font-medium theme-text-primary">
                      {submission.score}/{submission.totalMarks}
                    </p>
                    {submission.feedback && (
                      <>
                        <p className="text-sm theme-text-muted mt-2 mb-1">Previous Feedback:</p>
                        <p className="text-sm theme-text-primary">{submission.feedback}</p>
                      </>
                    )}
                  </div>
                )}
                
                <Button
                  onClick={submitGrade}
                  disabled={grading || !gradeForm.score}
                  className="w-full flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {grading ? 'Submitting...' : 'Submit Grade'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmission;