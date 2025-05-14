import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().min(1, "Status is required")
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  eventId: number;
  task?: {
    id: number;
    name: string;
    description?: string | null;
    dueDate?: string | null;
    status: string;
  };
  onClose: () => void;
}

export function TaskForm({ eventId, task, onClose }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormValues>({
    name: task?.name || '',
    description: task?.description || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    status: task?.status || 'active'
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormValues, string>>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/tasks`, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/tasks`] });
      toast({
        title: "Success",
        description: "Task added successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add task: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("PATCH", `/api/tasks/${task!.id}`, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/tasks`] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof TaskFormValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    try {
      taskSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof TaskFormValues, string>> = {};
        err.errors.forEach(error => {
          const path = error.path[0] as keyof TaskFormValues;
          newErrors[path] = error.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (task) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Task Name *</label>
          <input 
            type="text" 
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name of the task"
            required
          />
          {errors.name && (
            <div className="invalid-feedback">{errors.name}</div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea 
            className="form-control" 
            id="description"
            name="description"
            rows={3}
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Detailed description of the task"
          ></textarea>
        </div>
        
        <div className="mb-3">
          <label htmlFor="dueDate" className="form-label">Due Date</label>
          <input 
            type="date" 
            className="form-control"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="status" className="form-label">Status *</label>
          <select 
            className={`form-select ${errors.status ? 'is-invalid' : ''}`}
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {errors.status && (
            <div className="invalid-feedback">{errors.status}</div>
          )}
        </div>
      </div>
      
      <div className="modal-footer">
        <button 
          type="button" 
          className="btn btn-outline-secondary" 
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {task ? 'Saving...' : 'Adding...'}
            </>
          ) : (task ? 'Save Changes' : 'Add Task')}
        </button>
      </div>
    </form>
  );
}