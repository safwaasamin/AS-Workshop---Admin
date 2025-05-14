import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const attendeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  mentorId: z.number().optional().nullable(),
  score: z.union([z.number(), z.string()]).optional().nullable().transform(val => {
    if (val === '') return null;
    if (typeof val === 'string') return parseFloat(val) || null;
    return val;
  }),
  completionTime: z.string().optional().nullable()
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
  const [formData, setFormData] = useState<AttendeeFormValues>({
    name: attendee?.name || '',
    email: attendee?.email || '',
    company: attendee?.company || '',
    position: attendee?.position || '',
    phone: attendee?.phone || '',
    status: attendee?.status || 'registered',
    mentorId: attendee?.mentorId || null,
    score: attendee?.score || null,
    completionTime: attendee?.completionTime ? new Date(attendee.completionTime).toISOString().split('T')[0] : null
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AttendeeFormValues, string>>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AttendeeFormValues) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/attendees`, {
        ...data,
        completionTime: data.completionTime ? new Date(data.completionTime) : null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
      toast({
        title: "Success",
        description: "Attendee added successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add attendee: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: AttendeeFormValues) => {
      const response = await apiRequest("PATCH", `/api/attendees/${attendee!.id}`, {
        ...data,
        completionTime: data.completionTime ? new Date(data.completionTime) : null
      });
      return response.json();
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof AttendeeFormValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    try {
      attendeeSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof AttendeeFormValues, string>> = {};
        err.errors.forEach(error => {
          const path = error.path[0] as keyof AttendeeFormValues;
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
    
    if (attendee) {
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
          <label htmlFor="name" className="form-label">Name *</label>
          <input 
            type="text" 
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full name of attendee"
            required
          />
          {errors.name && (
            <div className="invalid-feedback">{errors.name}</div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email *</label>
          <input 
            type="email" 
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            required
          />
          {errors.email && (
            <div className="invalid-feedback">{errors.email}</div>
          )}
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="company" className="form-label">Company/Organization</label>
            <input 
              type="text" 
              className="form-control"
              id="company"
              name="company"
              value={formData.company || ''}
              onChange={handleChange}
              placeholder="Company or organization"
            />
          </div>
          
          <div className="col-md-6 mb-3">
            <label htmlFor="position" className="form-label">Position/Role</label>
            <input 
              type="text" 
              className="form-control"
              id="position"
              name="position"
              value={formData.position || ''}
              onChange={handleChange}
              placeholder="Current position or role"
            />
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input 
              type="text" 
              className="form-control"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="Contact phone number"
            />
          </div>
          
          <div className="col-md-6 mb-3">
            <label htmlFor="status" className="form-label">Status *</label>
            <select 
              className={`form-select ${errors.status ? 'is-invalid' : ''}`}
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="registered">Registered</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            {errors.status && (
              <div className="invalid-feedback">{errors.status}</div>
            )}
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="score" className="form-label">Score</label>
            <input 
              type="number" 
              className="form-control"
              id="score"
              name="score"
              min="0"
              max="100"
              step="0.1"
              value={formData.score === null ? '' : formData.score}
              onChange={handleChange}
              placeholder="Assessment score (0-100)"
            />
          </div>
          
          <div className="col-md-6 mb-3">
            <label htmlFor="completionTime" className="form-label">Completion Date</label>
            <input 
              type="date" 
              className="form-control"
              id="completionTime"
              name="completionTime"
              value={formData.completionTime || ''}
              onChange={handleChange}
            />
          </div>
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
              {attendee ? 'Saving...' : 'Add Attendee'}
            </>
          ) : (attendee ? 'Save Changes' : 'Add Attendee')}
        </button>
      </div>
    </form>
  );
}