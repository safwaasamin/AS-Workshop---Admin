import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Define form schema
const mentorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  expertise: z.string().min(1, "Expertise is required"),
  bio: z.string().optional()
});

type MentorFormValues = z.infer<typeof mentorSchema>;

interface MentorFormProps {
  eventId: number;
  mentor?: {
    id: number;
    name: string;
    email: string;
    expertise: string;
    bio?: string | null;
    assignedCount?: number | null;
  };
  onClose: () => void;
}

export function MentorForm({ eventId, mentor, onClose }: MentorFormProps) {
  const [formData, setFormData] = useState<MentorFormValues>({
    name: mentor?.name || '',
    email: mentor?.email || '',
    expertise: mentor?.expertise || '',
    bio: mentor?.bio || ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof MentorFormValues, string>>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: MentorFormValues) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/mentors`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/mentors`] });
      toast({
        title: "Success",
        description: "Mentor added successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add mentor: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: MentorFormValues) => {
      const response = await apiRequest("PATCH", `/api/mentors/${mentor!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/mentors`] });
      toast({
        title: "Success",
        description: "Mentor updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update mentor: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof MentorFormValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    try {
      mentorSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof MentorFormValues, string>> = {};
        err.errors.forEach(error => {
          const path = error.path[0] as keyof MentorFormValues;
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
    
    if (mentor) {
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
            placeholder="Full name of mentor"
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
        
        <div className="mb-3">
          <label htmlFor="expertise" className="form-label">Area of Expertise *</label>
          <input 
            type="text" 
            className={`form-control ${errors.expertise ? 'is-invalid' : ''}`}
            id="expertise"
            name="expertise"
            value={formData.expertise}
            onChange={handleChange}
            placeholder="e.g., Frontend Development, Machine Learning, DevOps"
            required
          />
          {errors.expertise && (
            <div className="invalid-feedback">{errors.expertise}</div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="bio" className="form-label">Bio / Profile</label>
          <textarea 
            className="form-control" 
            id="bio"
            name="bio"
            rows={3}
            value={formData.bio || ''}
            onChange={handleChange}
            placeholder="Brief description of mentor's background and experience"
          ></textarea>
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
              {mentor ? 'Saving...' : 'Adding...'}
            </>
          ) : (mentor ? 'Save Changes' : 'Add Mentor')}
        </button>
      </div>
    </form>
  );
}