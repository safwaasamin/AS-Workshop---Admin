import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TaskMonitoring } from "@/components/TaskMonitoring";
import { TaskForm } from "@/components/TaskForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });
  
  const { data: tasks, isLoading: tasksLoading, error } = useQuery<any[]>({
    queryKey: [`/api/events/${eventId}/tasks`],
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/tasks`] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      setShowDeleteModal(false);
      setDeleteTaskId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete task: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleEdit = (task: any) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };
  
  const handleDelete = (id: number) => {
    setDeleteTaskId(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (deleteTaskId) {
      deleteTaskMutation.mutate(deleteTaskId);
    }
  };
  
  const isLoading = eventsLoading || tasksLoading;
  
  if (isLoading) {
    return <Loading fullScreen />;
  }
  
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger" role="alert">
          Error loading data. Please try again.
        </div>
      </div>
    );
  }
  
  return (
    <div className="d-flex">
      <Sidebar />
      
      <main id="page-content" className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
        <Header eventName={events && events.length > 0 ? events[0].name : "AspiraSys Workshop System"} />
        
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Task Management</h2>
            <div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
              >
                <i className="bi bi-plus-lg me-2"></i>Add Task
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">All Tasks</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Task Name</th>
                      <th scope="col">Description</th>
                      <th scope="col">Due Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks && tasks.length > 0 ? (
                      tasks.map((task: any) => (
                        <tr key={task.id}>
                          <td className="fw-medium">{task.name}</td>
                          <td>{task.description || '-'}</td>
                          <td>
                            {task.dueDate 
                              ? new Date(task.dueDate).toLocaleDateString() 
                              : '-'}
                          </td>
                          <td>
                            <span className={`badge ${
                              task.status === 'active' ? 'bg-primary' : 
                              task.status === 'completed' ? 'bg-success' : 
                              'bg-secondary'
                            }`}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(task)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(task.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          <div className="text-muted">No tasks found</div>
                          <button 
                            className="btn btn-sm btn-outline-primary mt-2"
                            onClick={() => {
                              setEditingTask(null);
                              setShowTaskModal(true);
                            }}
                          >
                            Add Task
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Task Monitoring Component */}
          <TaskMonitoring eventId={eventId} />
          
          {/* Create/Edit Task Modal */}
          <div className={`modal fade ${showTaskModal ? 'show' : ''}`} 
            id="taskFormModal" 
            tabIndex={-1}
            style={{ display: showTaskModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingTask ? 'Edit Task' : 'Add Task'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowTaskModal(false)}
                  ></button>
                </div>
                <TaskForm 
                  eventId={eventId} 
                  task={editingTask}
                  onClose={() => setShowTaskModal(false)}
                />
              </div>
            </div>
          </div>
          
          {/* Delete Confirmation Modal */}
          <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} 
            id="deleteConfirmModal" 
            tabIndex={-1}
            style={{ display: showDeleteModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Task</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this task? This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={deleteTaskMutation.isPending}
                  >
                    {deleteTaskMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
