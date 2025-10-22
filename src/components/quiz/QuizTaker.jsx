import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Upload, FileText } from 'lucide-react';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

const QuizTaker = ({ quiz, onComplete }) => {
  // console.log('QuizTaker received quiz:', quiz); // Removed to stop infinite logging
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz?.timeLimit ? quiz.timeLimit * 60 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentFile, setAssignmentFile] = useState(null);

  useEffect(() => {
    if (quiz?.type === 'quiz' && quiz?.timeLimit) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (quiz.type === 'assignment') {
      return handleAssignmentSubmit();
    }

    setIsSubmitting(true);
    try {


      const response = await fetch(`http://localhost:5000/api/quiz/${quiz.id}/attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: answers,
          timeTaken: quiz.timeLimit ? (quiz.timeLimit * 60) - timeLeft : 0
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Quiz submitted successfully!');
        onComplete({
          score: data.attempt.score,
          totalMarks: data.attempt.totalPoints,
          percentage: data.attempt.percentage,
          passed: data.attempt.passed
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentFile) {
      toast.error('Please select a PDF file to upload');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const formData = new FormData();
      formData.append('assignment', assignmentFile);
      formData.append('quizId', quiz.id);

      const response = await fetch('http://localhost:5000/api/quiz/assignment/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit assignment');
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success('Assignment submitted successfully!');
        onComplete({ submitted: true });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {

      toast.error(error.message || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (quiz.type === 'assignment') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="theme-card rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold theme-text-primary">{quiz.title}</h2>
          </div>

          {quiz.description && (
            <div className="mb-6 p-4 theme-bg-secondary rounded-lg border-l-4 border-blue-500">
              <h4 className="font-medium theme-text-primary mb-2">Assignment Instructions:</h4>
              <p className="theme-text-secondary whitespace-pre-wrap">{quiz.description}</p>
            </div>
          )}

          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Submission Guidelines:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Upload your assignment as a PDF file</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Make sure your file is properly formatted</li>
              <li>• Once submitted, you cannot change your submission</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium theme-text-primary mb-2">
              Upload Assignment (PDF only)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setAssignmentFile(e.target.files[0])}
              className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
            />
            {assignmentFile && (
              <p className="text-sm theme-text-secondary mt-2">
                Selected: {assignmentFile.name} ({(assignmentFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!assignmentFile || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Assignment
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }


  
  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="theme-card rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold theme-text-primary mb-4">Quiz Not Available</h2>
          <p className="theme-text-secondary mb-4">Quiz data is missing.</p>
          <Button onClick={() => onComplete({ error: true })}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  if (!quiz.questions) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="theme-card rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold theme-text-primary mb-4">Quiz Not Available</h2>
          <p className="theme-text-secondary mb-4">Quiz questions property is missing.</p>
          <Button onClick={() => onComplete({ error: true })}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  if (quiz.questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="theme-card rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold theme-text-primary mb-4">Quiz Not Available</h2>
          <p className="theme-text-secondary mb-4">This quiz has no questions.</p>
          <Button onClick={() => onComplete({ error: true })}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  


  // Additional safety check for current question
  if (!currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="theme-card rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold theme-text-primary mb-4">Question Not Found</h2>
          <p className="theme-text-secondary mb-4">Unable to load the current question.</p>
          <Button onClick={() => onComplete({ error: true })}>Go Back</Button>
        </div>
      </div>
    );
  }
  


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="theme-card rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold theme-text-primary">{quiz.title}</h2>
          {quiz.timeLimit && (
            <div className="flex items-center space-x-2 text-orange-600">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Quiz Description/Instructions */}
        {quiz.description && (
          <div className="mb-6 p-4 theme-bg-secondary rounded-lg border-l-4 border-blue-500">
            <h4 className="font-medium theme-text-primary mb-2">Instructions:</h4>
            <p className="theme-text-secondary whitespace-pre-wrap">{quiz.description}</p>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm theme-text-secondary mb-2">
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-medium theme-text-primary mb-2">
              {currentQuestion.question}
            </h3>
            <p className="text-sm theme-text-secondary">
              Marks: {currentQuestion.marks}
            </p>
          </div>

          {/* Single Correct Options */}
          {currentQuestion.type === 'single_correct' && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 theme-bg-secondary rounded-lg cursor-pointer hover:theme-bg-tertiary transition-colors">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="text-primary-600"
                  />
                  <span className="theme-text-primary">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Multiple Correct Options */}
          {currentQuestion.type === 'multiple_correct' && (
            <div className="space-y-3">
              <p className="text-sm theme-text-secondary mb-3">Select all correct answers:</p>
              {currentQuestion.options.map((option, index) => {
                const currentAnswers = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
                return (
                  <label key={index} className="flex items-center space-x-3 p-3 theme-bg-secondary rounded-lg cursor-pointer hover:theme-bg-tertiary transition-colors">
                    <input
                      type="checkbox"
                      value={option}
                      checked={currentAnswers.includes(option)}
                      onChange={(e) => {
                        const newAnswers = e.target.checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter(ans => ans !== option);
                        handleAnswerChange(currentQuestion.id, newAnswers);
                      }}
                      className="text-primary-600"
                    />
                    <span className="theme-text-primary">{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.type === 'true_false' && (
            <div className="space-y-3">
              {['true', 'false'].map((option) => (
                <label key={option} className="flex items-center space-x-3 p-3 theme-bg-secondary rounded-lg cursor-pointer hover:theme-bg-tertiary transition-colors">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="text-primary-600"
                  />
                  <span className="theme-text-primary capitalize">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary-600 text-white'
                    : answers[quiz.questions[index].id]
                    ? 'bg-green-600 text-white'
                    : 'theme-bg-secondary theme-text-primary hover:theme-bg-tertiary'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Quiz</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;