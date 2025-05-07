import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TaskMonitoring } from "@/components/TaskMonitoring";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['/api/events'],
  });
  
  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/tasks`, taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/tasks`] });
      toast({
        title: "Success",
        description: "Task added successfully",
      });
      // Reset form
      setIsAddingTask(false);
      setTaskName("");
      setTaskDescription("");
      setTaskDueDate("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  });
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskName) {
      toast({
        title: "Validation Error",
        description: "Task name is required",
        variant: "destructive",
      });
      return;
    }
    
    addTaskMutation.mutate({
      name: taskName,
      description: taskDescription,
      dueDate: taskDueDate ? new Date(taskDueDate) : null,
      status: "active"
    });
  };
  
  if (isLoading) {
    return <Loading fullScreen />;
  }
  
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger" role="alert">
          Error loading events data. Please try again.
        </div>
      </div>
    );
  }
  
  return (
    <div className="d-flex">
      <Sidebar />
      
      <main id="page-content" className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
        <Header eventName={events && events[0] ? events[0].name : "Tech Conference 2023"} />
        
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Task Monitoring</h2>
            <div>
              <button 
                className="btn btn-primary"
                onClick={() => setIsAddingTask(!isAddingTask)}
              >
                {isAddingTask ? (
                  <>
                    <i className="bi bi-x-lg me-2"></i>Cancel
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg me-2"></i>Add Task
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Add Task Form */}
          {isAddingTask && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">Add New Task</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleAddTask}>
                  <div className="mb-3">
                    <label htmlFor="taskName" className="form-label">Task Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="taskName"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="taskDescription" className="form-label">Description</label>
                    <textarea 
                      className="form-control" 
                      id="taskDescription"
                      rows={3}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="taskDueDate" className="form-label">Due Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      id="taskDueDate"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                    />
                  </div>
                  <div className="text-end">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary me-2"
                      onClick={() => setIsAddingTask(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={addTaskMutation.isPending}
                    >
                      {addTaskMutation.isPending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Adding...
                        </>
                      ) : 'Add Task'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Task Monitoring Component */}
          <TaskMonitoring eventId={eventId} />
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
