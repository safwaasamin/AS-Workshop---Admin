import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const attendeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["registered", "in_progress", "completed"]),
  mentorId: z.number().optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  completionTime: z.string().optional().nullable(),
});

type AttendeeFormValues = z.infer<typeof attendeeSchema>;

interface AttendeeFormProps {
  eventId: number;
  attendee?: {
    id: number;
    name: string;
    email: string;
    company?: string | null;
    position?: string | null;
    phone?: string | null;
    status: string;
    mentorId?: number | null;
    score?: number | null;
    completionTime?: string | null;
  };
  onClose: () => void;
}

export function AttendeeForm({ eventId, attendee, onClose }: AttendeeFormProps) {
  const [generateCredentials, setGenerateCredentials] = useState(!attendee);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<AttendeeFormValues>({
    resolver: zodResolver(attendeeSchema),
    defaultValues: attendee ? {
      name: attendee.name,
      email: attendee.email,
      company: attendee.company || "",
      position: attendee.position || "",
      phone: attendee.phone || "",
      status: attendee.status as "registered" | "in_progress" | "completed",
      mentorId: attendee.mentorId || null,
      score: attendee.score || null,
      completionTime: attendee.completionTime || null,
    } : {
      name: "",
      email: "",
      company: "",
      position: "",
      phone: "",
      status: "registered",
      mentorId: null,
      score: null,
      completionTime: null,
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: AttendeeFormValues & { generateCredentials?: boolean }) => {
      const res = await apiRequest(
        "POST", 
        `/api/events/${eventId}/attendees`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
      toast({
        title: "Success",
        description: "Attendee created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create attendee: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: AttendeeFormValues) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/attendees/${attendee?.id}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
      toast({
        title: "Success",
        description: "Attendee updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update attendee: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: AttendeeFormValues) => {
    if (attendee) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        ...data,
        generateCredentials
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="modal-body">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name *</label>
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
          <label htmlFor="email" className="form-label">Email *</label>
          <input 
            type="email" 
            className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
            id="email" 
            {...register("email")}
          />
          {errors.email && (
            <div className="invalid-feedback">{errors.email.message}</div>
          )}
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="company" className="form-label">Company</label>
            <input 
              type="text" 
              className="form-control" 
              id="company" 
              {...register("company")}
            />
          </div>
          
          <div className="col-md-6 mb-3">
            <label htmlFor="position" className="form-label">Position</label>
            <input 
              type="text" 
              className="form-control" 
              id="position" 
              {...register("position")}
            />
          </div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="phone" className="form-label">Phone</label>
          <input 
            type="text" 
            className="form-control" 
            id="phone" 
            {...register("phone")}
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="status" className="form-label">Status *</label>
          <select 
            className={`form-select ${errors.status ? 'is-invalid' : ''}`} 
            id="status"
            {...register("status")}
          >
            <option value="registered">Registered</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {errors.status && (
            <div className="invalid-feedback">{errors.status.message}</div>
          )}
        </div>
        
        {!attendee && (
          <div className="form-check mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="generateCredentials"
              checked={generateCredentials}
              onChange={() => setGenerateCredentials(!generateCredentials)}
            />
            <label className="form-check-label" htmlFor="generateCredentials">
              Generate login credentials
            </label>
            <div className="form-text small text-muted">
              Email will be used as username and a random password will be generated.
            </div>
          </div>
        )}
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
              {attendee ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            attendee ? 'Update Attendee' : 'Create Attendee'
          )}
        </button>
      </div>
    </form>
  );
}