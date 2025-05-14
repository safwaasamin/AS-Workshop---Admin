import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const mentorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  expertise: z.string().min(2, "Expertise must be at least 2 characters"),
  bio: z.string().optional().nullable(),
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
    assignedCount?: number;
  };
  onClose: () => void;
}

export function MentorForm({ eventId, mentor, onClose }: MentorFormProps) {
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<MentorFormValues>({
    resolver: zodResolver(mentorSchema),
    defaultValues: mentor ? {
      name: mentor.name,
      email: mentor.email,
      expertise: mentor.expertise,
      bio: mentor.bio || "",
    } : {
      name: "",
      email: "",
      expertise: "",
      bio: "",
    }
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: MentorFormValues) => {
      const res = await apiRequest(
        "POST", 
        `/api/events/${eventId}/mentors`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/mentors`] });
      toast({
        title: "Success",
        description: "Mentor created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create mentor: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: MentorFormValues) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/mentors/${mentor?.id}`, 
        data
      );
      return await res.json();
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
  
  const onSubmit = (data: MentorFormValues) => {
    if (mentor) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
        
        <div className="mb-3">
          <label htmlFor="expertise" className="form-label">Expertise *</label>
          <input 
            type="text" 
            className={`form-control ${errors.expertise ? 'is-invalid' : ''}`} 
            id="expertise" 
            {...register("expertise")}
          />
          {errors.expertise && (
            <div className="invalid-feedback">{errors.expertise.message}</div>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="bio" className="form-label">Bio</label>
          <textarea 
            className="form-control" 
            id="bio" 
            rows={3}
            {...register("bio")}
          ></textarea>
        </div>
        
        {mentor && (
          <div className="alert alert-info">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle me-2"></i>
              <div>
                <strong>Assigned Attendees:</strong> {mentor.assignedCount || 0}
              </div>
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
              {mentor ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            mentor ? 'Update Mentor' : 'Create Mentor'
          )}
        </button>
      </div>
    </form>
  );
}