import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

const QuizBuilder = ({ isOpen, onClose, chapterId, videos, onQuizCreated }) => {
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    type: 'quiz',
    position: 'end_of_chapter',
    videoId: '',
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

  const handleQuizSubmit = async () => {
    if (!quizForm.title.trim()) {
      toast.error('Please enter quiz title');
      return;
    }

    try {
      // First create the quiz
      const quizResponse = await fetch('http://localhost:5000/api/quiz', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...quizForm,
          chapterId,
          passingMarks: quizForm.type === 'assignment' ? 0 : quizForm.passingMarks,
          totalMarks: quizForm.type === 'assignment' ? quizForm.totalMarks : 0
        })
      });

      if (!quizResponse.ok) {
        const errorData = await quizResponse.json();
        throw new Error(errorData.message || 'Failed to create quiz');
      }

      const quizData = await quizResponse.json();
      if (!quizData.success) throw new Error(quizData.message);

      // Then add questions if it's a quiz type and has questions
      if (quizForm.type === 'quiz' && questions.length > 0) {
        let questionErrors = [];
        
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          try {
            // Validate question data before sending
            const questionData = {
              quizId: quizData.quiz.id,
              question: question.question.trim(),
              type: question.type,
              options: (question.type === 'single_correct' || question.type === 'multiple_correct') 
                ? question.options.filter(opt => opt.trim() !== '') 
                : null,
              correctAnswer: question.correctAnswer,
              marks: parseInt(question.marks) || 1
            };

            const questionResponse = await fetch(`http://localhost:5000/api/quiz/${quizData.quiz.id}/questions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(questionData)
            });
            
            if (!questionResponse.ok) {
              const errorData = await questionResponse.json();
              questionErrors.push(`Question ${i + 1}: ${errorData.message}`);
            }
          } catch (err) {
            questionErrors.push(`Question ${i + 1}: ${err.message}`);
          }
        }
        
        if (questionErrors.length > 0) {
          toast.error(`Quiz created but some questions failed: ${questionErrors.join(', ')}`);
        }
      }

      toast.success(`${quizForm.type === 'quiz' ? 'Quiz' : 'Assignment'} created successfully!`);
      if (onQuizCreated) {
        await onQuizCreated();
      }
      onClose();
      resetForm();
    } catch (error) {
      console.error('Create quiz error:', error);
      toast.error(error.message || 'Failed to create quiz');
    }
  };

  const addQuestion = () => {
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

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      question: '',
      type: 'single_correct',
      options: ['', ''],
      correctAnswer: '',
      marks: 1
    });
    setShowQuestionForm(false);
  };

  const resetForm = () => {
    setQuizForm({
      title: '',
      description: '',
      type: 'quiz',
      position: 'end_of_chapter',
      videoId: '',
      timeLimit: null,
      passingMarks: 60,
      totalMarks: 100
    });
    setQuestions([]);
    setCurrentQuestion({
      question: '',
      type: 'single_correct',
      options: ['', ''],
      correctAnswer: '',
      marks: 1
    });
    setShowQuestionForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="theme-card rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b theme-border">
          <h3 className="text-xl font-semibold theme-text-primary">
            Create {quizForm.type === 'quiz' ? 'Quiz' : 'Assignment'}
          </h3>
          <button onClick={onClose} className="theme-text-muted hover:theme-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium theme-text-primary mb-2">Title *</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter quiz/assignment title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">Type</label>
              <select
                value={quizForm.type}
                onChange={(e) => setQuizForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
              >
                <option value="quiz">Quiz (Auto-graded)</option>
                <option value="assignment">Assignment (PDF Upload)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">Position</label>
              <select
                value={quizForm.position}
                onChange={(e) => setQuizForm(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
              >
                <option value="end_of_chapter">End of Chapter</option>
                <option value="after_video">After Specific Video</option>
              </select>
            </div>

            {quizForm.position === 'after_video' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium theme-text-primary mb-2">Select Video</label>
                <select
                  value={quizForm.videoId}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, videoId: e.target.value }))}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
                >
                  <option value="">Select a video</option>
                  {videos.map(video => (
                    <option key={video.id} value={video.id}>{video.title}</option>
                  ))}
                </select>
              </div>
            )}
            
            {quizForm.type === 'assignment' && (
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-2">Total Marks</label>
                <input
                  type="number"
                  value={quizForm.totalMarks}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg"
                  min="1"
                  placeholder="100"
                />
              </div>
            )}
            
            {quizForm.type === 'quiz' && (
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
            )}
          </div>

          {quizForm.type === 'quiz' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold theme-text-primary">Questions ({questions.length})</h4>
                <Button onClick={() => setShowQuestionForm(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {showQuestionForm && (
                <div className="p-4 theme-bg-tertiary rounded-lg space-y-4">
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
                      <p className="text-xs theme-text-secondary mt-1">
                        {currentQuestion.type === 'single_correct' 
                          ? 'Select the radio button next to the correct answer'
                          : 'Check all correct answers'}
                      </p>
                    </div>
                  )}

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
                    <Button onClick={addQuestion} size="sm">Add Question</Button>
                    <Button onClick={() => setShowQuestionForm(false)} variant="outline" size="sm">Cancel</Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div key={index} className="p-4 theme-bg-secondary rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium theme-text-primary mb-2">{index + 1}. {q.question}</p>
                        <div className="flex items-center space-x-4 text-sm theme-text-secondary">
                          <span>Type: {q.type.replace('_', ' ').toUpperCase()}</span>
                          <span>Marks: {q.marks}</span>
                          {q.type !== 'true_false' && (
                            <span>Options: {q.options.length}</span>
                          )}
                        </div>
                        {q.type !== 'true_false' && q.options.length > 0 && (
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
                      <button
                        onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t theme-border">
            <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={handleQuizSubmit} className="flex-1">
              Create {quizForm.type === 'quiz' ? 'Quiz' : 'Assignment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;