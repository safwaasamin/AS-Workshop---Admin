import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";

interface FeedbackSetupProps {
  eventId: number;
}

export function FeedbackSetup({ eventId }: FeedbackSetupProps) {
  const [questions, setQuestions] = useState<{ question: string, type: string }[]>([
    { question: "", type: "rating" }
  ]);
  
  const queryClient = useQueryClient();
  
  // Get existing questions
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/feedback-questions`],
    enabled: !!eventId,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setQuestions(data.map(q => ({ question: q.question, type: q.type })));
      }
    }
  });
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: { question: string, type: string, order: number }) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/feedback-questions`, questionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/feedback-questions`] });
    }
  });
  
  // Handlers
  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };
  
  const handleTypeChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].type = value;
    setQuestions(newQuestions);
  };
  
  const handleAddQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, { question: "", type: "rating" }]);
    }
  };
  
  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate questions
    const validQuestions = questions.filter(q => q.question.trim() !== "");
    if (validQuestions.length === 0) {
      // Show error
      return;
    }
    
    // Submit each question
    for (let i = 0; i < validQuestions.length; i++) {
      await createQuestionMutation.mutateAsync({
        question: validQuestions[i].question,
        type: validQuestions[i].type,
        order: i + 1
      });
    }
  };
  
  if (isLoading) return <Loading />;
  
  return (
    <div className="row">
      <div className="col-lg-7">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0">Feedback Questions</h5>
          </div>
          <div className="card-body">
            {error ? (
              <div className="alert alert-danger">
                Error loading feedback questions. Please try again.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-muted mb-4">
                  Create up to 10 feedback questions for participants. Questions can be either rating (1-5) or text comment type.
                </p>
                
                {questions.map((q, index) => (
                  <div key={index} className="mb-4 p-3 border rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <h6>Question {index + 1}</h6>
                      {questions.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Question Text</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Enter your question"
                        value={q.question}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="mb-2">
                      <label className="form-label">Question Type</label>
                      <select 
                        className="form-select"
                        value={q.type}
                        onChange={(e) => handleTypeChange(index, e.target.value)}
                      >
                        <option value="rating">Rating (1-5)</option>
                        <option value="text">Text Comment</option>
                      </select>
                    </div>
                  </div>
                ))}
                
                {questions.length < 10 && (
                  <button 
                    type="button" 
                    className="btn btn-outline-primary mb-4"
                    onClick={handleAddQuestion}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Question
                  </button>
                )}
                
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={createQuestionMutation.isPending}
                  >
                    {createQuestionMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Save Feedback Questions'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0">Preview</h5>
          </div>
          <div className="card-body">
            {questions.filter(q => q.question.trim() !== "").length === 0 ? (
              <p className="text-muted">Add questions to see a preview of your feedback form</p>
            ) : (
              <div className="feedback-preview">
                <h5 className="mb-4">Participant Feedback Form</h5>
                
                {questions.map((q, index) => (
                  q.question.trim() !== "" && (
                    <div key={index} className="mb-4">
                      <label className="form-label fw-semibold">
                        {index + 1}. {q.question}
                      </label>
                      
                      {q.type === "rating" ? (
                        <div className="rating-input d-flex">
                          {[1, 2, 3, 4, 5].map(num => (
                            <div key={num} className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name={`rating-${index}`} 
                                id={`rating-${index}-${num}`}
                                disabled
                              />
                              <label className="form-check-label" htmlFor={`rating-${index}-${num}`}>
                                {num}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <textarea 
                          className="form-control" 
                          rows={3} 
                          placeholder="Your answer here..."
                          disabled
                        ></textarea>
                      )}
                    </div>
                  )
                ))}
                
                <button type="button" className="btn btn-primary mt-2" disabled>
                  Submit Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
