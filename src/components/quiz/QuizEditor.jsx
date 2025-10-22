import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

const QuizEditor = ({ isOpen, onClose, quizId, onQuizUpdated }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    timeLimit: null,
    passingMarks: 60,
    totalMarks: 100
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'single_correct',
    options: ['', ''],
    correctAnswer: '',
    marks: 1
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuizDetails();
    }
  }, [isOpen, quizId]);

  const fetchQuizDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/quizzes/${quizId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        const quizData = data.quiz;
        
        setQuiz(quizData);
        setQuizForm({
          title: quizData.title,
          description: quizData.description || '',
          timeLimit: quizData.timeLimit,
          passingMarks: quizData.passingMarks || 60,
          totalMarks: quizData.totalMarks || 100
        });
        setQuestions(quizData.questions || []);
      } else {
        throw new Error('Failed to fetch quiz details');
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      toast.error('Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizUpdate = async () => {
    if (!quizForm.title.trim()) {
      toast.error('Please enter quiz title');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/quiz/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizForm)
      });

      if (response.ok) {
        toast.success('Quiz updated successfully!');
        if (onQuizUpdated) {
          await onQuizUpdated();
        }
        onClose();
      } else {
        throw new Error('Failed to update quiz');
      }
    } catch (error) {
      console.error('Update quiz error:', error);
      toast.error('Failed to update quiz');
    }
  };

  const addQuestion = async () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Please enter question text');
      return;
    }

    if (currentQuestion.type === 'true_false') {
      if (!currentQuestion.correctAnswer) {
        toast.error('Please select true or false');
        return;
      }
    } else {
      if (currentQuestion.options.some(opt => !opt.trim())) {
        toast.error('Please fill all options');
        return;
      }
      
      if (currentQuestion.type === 'single_correct' && !currentQuestion.correctAnswer) {
        toast.error('Please select the correct answer');
        return;
      }
      
      if (currentQuestion.type === 'multiple_correct') {
        const correctAnswers = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [];
        if (correctAnswers.length === 0) {
          toast.error('Please select at least one correct answer');
          return;
        }
      }
    }

    try {
      const questionData = {
        quizId,
        question: currentQuestion.question.trim(),
        type: currentQuestion.type,
        options: (currentQuestion.type === 'single_correct' || currentQuestion.type === 'multiple_correct') 
          ? currentQuestion.options.filter(opt => opt.trim() !== '') 
          : null,
        correctAnswer: currentQuestion.correctAnswer,
        marks: parseInt(currentQuestion.marks) || 1
      };

      const response = await fetch(`http://localhost:5000/api/quiz/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Question added response:', data);
        
        // Create question object with proper structure
        const newQuestion = {
          id: data.question.id,
          question: currentQuestion.question,
          type: currentQuestion.type,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.correctAnswer,
          marks: currentQuestion.marks
        };
        
        setQuestions(prev => [...prev, newQuestion]);
        resetQuestionForm();
        toast.success('Question added successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add question');
      }
    } catch (error) {
      console.error('Add question error:', error);
      toast.error(error.message || 'Failed to add question');
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/quiz/questions/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        toast.success('Question deleted successfully!');
      } else {
        throw new Error('Failed to delete question');
      }
    } catch (error) {
      console.error('Delete question error:', error);
      toast.error('Failed to delete question');
    }
  };

  const editQuestion = (question) => {
    setCurrentQuestion({
      question: question.question,
      type: question.type,
      options: question.options || ['', ''],
      correctAnswer: question.correctAnswer,
      marks: question.marks
    });
    setEditingQuestion(question.id);
    setShowQuestionForm(true);
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      question: '',
      type: 'single_correct',
      options: ['', ''],
      correctAnswer: '',
      marks: 1
    });
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="theme-card rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="theme-text-primary mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="theme-card rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b theme-border">
          <h3 className="text-xl font-semibold theme-text-primary">Edit Quiz</h3>
          <button onClick={onClose} className="theme-text-muted hover:theme-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quiz Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium theme-text-primary mb-2">Title *</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter quiz title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium theme-text-primary mb-2">Description</label>
              <textarea
                value={quizForm.description}
                onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter quiz description"
              />
            </div>

            {quiz?.type === 'assignment' && (
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-2">Total Marks</label>
                <input
                  type="number"
                  value={quizForm.totalMarks}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="1"
                  placeholder="100"
                />
              </div>
            )}
            
            {quiz?.type === 'quiz' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium theme-text-primary mb-2">Time Limit</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timeLimit"
                        checked={!quizForm.timeLimit}
                        onChange={() => setQuizForm(prev => ({ ...prev, timeLimit: null }))}
                        className="mr-2"
                      />
                      No time limit
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="timeLimit"
                        checked={!!quizForm.timeLimit}
                        onChange={() => setQuizForm(prev => ({ ...prev, timeLimit: 30 }))}
                        className="mr-2"
                      />
                      <span>Set time limit:</span>
                      {quizForm.timeLimit && (
                        <>
                          <input
                            type="number"
                            value={quizForm.timeLimit}
                            onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                            className="w-20 px-2 py-1 theme-bg-secondary theme-text-primary border theme-border rounded"
                            min="1"
                            placeholder="30"
                          />
                          <span className="text-sm theme-text-secondary">minutes</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium theme-text-primary mb-2">Passing Marks</label>
                  <input
                    type="number"
                    value={quizForm.passingMarks}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, passingMarks: parseInt(e.target.value) || 60 }))}
                    className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500"
                    min="0"
                    placeholder="60"
                  />
                </div>
              </>
            )}
          </div>

          {/* Questions Section */}
          {quiz?.type === 'quiz' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold theme-text-primary">Questions ({questions.length})</h4>
                <Button onClick={() => setShowQuestionForm(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {/* Question Form */}
              {showQuestionForm && (
                <div className="p-4 theme-bg-tertiary rounded-lg space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium theme-text-primary mb-2">Question *</label>
                    <textarea
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
                      placeholder="Enter your question"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium theme-text-primary mb-2">Type</label>
                      <select
                        value={currentQuestion.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setCurrentQuestion(prev => ({ 
                            ...prev, 
                            type: newType,
                            options: newType === 'true_false' ? [] : ['', ''],
                            correctAnswer: newType === 'multiple_correct' ? [] : ''
                          }));
                        }}
                        className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
                      >
                        <option value="single_correct">Single Correct Answer</option>
                        <option value="multiple_correct">Multiple Correct Answers</option>
                        <option value="true_false">True/False</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium theme-text-primary mb-2">Marks</label>
                      <input
                        type="number"
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Options for MCQ */}
                  {(currentQuestion.type === 'single_correct' || currentQuestion.type === 'multiple_correct') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium theme-text-primary">Options *</label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setCurrentQuestion(prev => ({ ...prev, options: [...prev.options, ''] }))}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Option
                          </button>
                          {currentQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = currentQuestion.options.slice(0, -1);
                                setCurrentQuestion(prev => ({ 
                                  ...prev, 
                                  options: newOptions,
                                  correctAnswer: Array.isArray(prev.correctAnswer) 
                                    ? prev.correctAnswer.filter(ans => newOptions.includes(ans))
                                    : newOptions.includes(prev.correctAnswer) ? prev.correctAnswer : ''
                                }));
                              }}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              - Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            {currentQuestion.type === 'single_correct' ? (
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={currentQuestion.correctAnswer === option && option.trim() !== ''}
                                onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }))}
                                className="text-blue-600"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={Array.isArray(currentQuestion.correctAnswer) 
                                  ? currentQuestion.correctAnswer.includes(option) && option.trim() !== ''
                                  : false}
                                onChange={(e) => {
                                  const currentAnswers = Array.isArray(currentQuestion.correctAnswer) 
                                    ? currentQuestion.correctAnswer : [];
                                  if (e.target.checked) {
                                    setCurrentQuestion(prev => ({ 
                                      ...prev, 
                                      correctAnswer: [...currentAnswers, option] 
                                    }));
                                  } else {
                                    setCurrentQuestion(prev => ({ 
                                      ...prev, 
                                      correctAnswer: currentAnswers.filter(ans => ans !== option) 
                                    }));
                                  }
                                }}
                                className="text-blue-600"
                              />
                            )}
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options];
                                const oldValue = newOptions[index];
                                newOptions[index] = e.target.value;
                                
                                setCurrentQuestion(prev => {
                                  let newCorrectAnswer = prev.correctAnswer;
                                  
                                  if (currentQuestion.type === 'single_correct') {
                                    if (prev.correctAnswer === oldValue) {
                                      newCorrectAnswer = e.target.value;
                                    }
                                  } else {
                                    if (Array.isArray(prev.correctAnswer)) {
                                      newCorrectAnswer = prev.correctAnswer.map(ans => 
                                        ans === oldValue ? e.target.value : ans
                                      );
                                    }
                                  }
                                  
                                  return { 
                                    ...prev, 
                                    options: newOptions,
                                    correctAnswer: newCorrectAnswer
                                  };
                                });
                              }}
                              className="flex-1 px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* True/False Options */}
                  {currentQuestion.type === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium theme-text-primary mb-2">Correct Answer *</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="tfAnswer"
                            value="true"
                            checked={currentQuestion.correctAnswer === 'true'}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                            className="mr-2"
                          />
                          True
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="tfAnswer"
                            value="false"
                            checked={currentQuestion.correctAnswer === 'false'}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                            className="mr-2"
                          />
                          False
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button onClick={addQuestion} size="sm">
                      {editingQuestion ? 'Update Question' : 'Add Question'}
                    </Button>
                    <Button onClick={resetQuestionForm} variant="outline" size="sm">Cancel</Button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 theme-bg-secondary rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium theme-text-primary mb-2">{index + 1}. {q.question}</p>
                        <div className="flex items-center space-x-4 text-sm theme-text-secondary">
                          <span>Type: {q.type ? q.type.replace('_', ' ').toUpperCase() : 'Unknown'}</span>
                          <span>Marks: {q.marks}</span>
                          {q.type !== 'true_false' && (
                            <span>Options: {q.options?.length || 0}</span>
                          )}
                        </div>
                        {q.type !== 'true_false' && q.options && q.options.length > 0 && (
                          <div className="mt-2 text-sm theme-text-secondary">
                            <div className="grid grid-cols-2 gap-1">
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center space-x-1">
                                  <span className={`w-2 h-2 rounded-full ${
                                    (Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(opt) : q.correctAnswer === opt)
                                      ? 'bg-green-500' : 'bg-gray-300'
                                  }`}></span>
                                  <span className="truncate">{opt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editQuestion(q)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t theme-border">
            <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={handleQuizUpdate} className="flex-1">Update Quiz</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;