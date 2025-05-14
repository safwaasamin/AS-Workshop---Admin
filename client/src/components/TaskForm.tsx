import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const taskSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["active", "completed", "pending"]),
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
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? {
      name: task.name,
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      status: task.status as "active" | "completed" | "pending",
    } : {
      name: "",
      description: "",
      dueDate: "",
      status: "pending",
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const formattedData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      
      const res = await apiRequest(
        "POST", 
        `/api/events/${eventId}/tasks`, 
        formattedData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/tasks`] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const formattedData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      
      const res = await apiRequest(
        "PATCH", 
        `/api/tasks/${task?.id}`, 
        formattedData
      );
      return await res.json();
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
  
  const onSubmit = (data: TaskFormValues) => {
    if (task) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="modal-body">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Task Name *</label>
          <input 
            type="text" 
            className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
            id="name" 
            {...register("name")}
          />
          {errors.name && (
            <div className="invalid-feedback">{errors.name.message}</div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea 
            className="form-control" 
            id="description" 
            rows={3}
            {...register("description")}
          ></textarea>
        </div>
        
        <div className="mb-3">
          <label htmlFor="dueDate" className="form-label">Due Date</label>
          <input 
            type="date" 
            className="form-control" 
            id="dueDate" 
            {...register("dueDate")}
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="status" className="form-label">Status *</label>
          <select 
            className={`form-select ${errors.status ? 'is-invalid' : ''}`} 
            id="status"
            {...register("status")}
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          {errors.status && (
            <div className="invalid-feedback">{errors.status.message}</div>
          )}
        </div>
      </div>
      
      <div className="modal-footer">
        <button 
          type="button" 
          className="btn btn-outline-secondary" 
          onClick={onClose}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              {task ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            task ? 'Update Task' : 'Create Task'
          )}
        </button>
      </div>
    </form>
  );
}