import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

interface MentorListProps {
  eventId: number;
  onSelectMentor?: (mentorId: number) => void;
}

export function MentorList({ eventId, onSelectMentor }: MentorListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/mentors`],
    enabled: !!eventId,
  });
  
  if (isLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading mentors. Please try again.
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Available Mentors</h5>
        </div>
        <div className="card-body">
          <p className="text-muted">No mentors found. Add mentors to assign them to participants.</p>
        </div>
      </div>
    );
  }
  
  const colorClasses = ['primary', 'info', 'warning', 'danger', 'secondary'];
  
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0">Available Mentors</h5>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {data.map((mentor, index) => (
            <div 
              key={mentor.id} 
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3"
              onClick={() => onSelectMentor && onSelectMentor(mentor.id)}
              role={onSelectMentor ? "button" : undefined}
            >
              <div className="d-flex align-items-center">
                <div 
                  className={`rounded-circle bg-${colorClasses[index % colorClasses.length]} text-white d-flex align-items-center justify-content-center me-3`} 
                  style={{ width: "40px", height: "40px" }}
                >
                  <span>{mentor.initials}</span>
                </div>
                <div>
                  <h6 className="mb-0">{mentor.name}</h6>
                  <span className="small text-muted">{mentor.expertise}</span>
                </div>
              </div>
              <span className="badge bg-success rounded-pill">{mentor.assignedCount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
