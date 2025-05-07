import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MentorList } from "@/components/MentorList";
import { MentorAssignment } from "@/components/MentorAssignment";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";

export default function Mentors() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['/api/events'],
  });
  
  // Add Mentor mutation
  const addMentorMutation = useMutation({
    mutationFn: async (mentorData: any) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/mentors`, mentorData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/mentors`] });
      toast({
        title: "Success",
        description: "Mentor added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add mentor",
        variant: "destructive",
      });
    }
  });
  
  // Auto-assign mentors (for demo, just show a toast)
  const handleAutoAssign = () => {
    toast({
      title: "Auto-Assignment",
      description: "Auto-assignment would be implemented here in a real application.",
    });
  };
  
  // Open add mentor modal
  const handleAddMentor = () => {
    // This would normally open a modal - for demo we'll use a simplified approach
    const name = prompt("Enter mentor name");
    const email = prompt("Enter mentor email");
    const expertise = prompt("Enter mentor expertise");
    
    if (name && email && expertise) {
      addMentorMutation.mutate({
        name,
        email,
        expertise,
        bio: ""
      });
    }
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
            <h2 className="fw-bold">Mentor Assignment</h2>
            <div>
              <button 
                className="btn btn-outline-secondary me-2"
                onClick={handleAddMentor}
                disabled={addMentorMutation.isPending}
              >
                {addMentorMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i>Add Mentor
                  </>
                )}
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAutoAssign}
              >
                <i className="bi bi-link me-2"></i>Auto-Assign Mentors
              </button>
            </div>
          </div>

          <div className="row g-4">
            {/* Mentors List */}
            <div className="col-lg-5">
              <MentorList eventId={eventId} />
            </div>

            {/* Assignment Interface */}
            <div className="col-lg-7">
              <MentorAssignment eventId={eventId} />
            </div>
          </div>
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
