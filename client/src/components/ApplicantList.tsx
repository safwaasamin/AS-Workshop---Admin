import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";
import { Attendee } from "@shared/schema";

interface ApplicantListProps {
  eventId: number;
}

export function ApplicantList({ eventId }: ApplicantListProps) {
  const { data, isLoading, error } = useQuery<Attendee[]>({
    queryKey: [`/api/events/${eventId}/attendees`],
    enabled: !!eventId,
  });
  
  if (isLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading applicants. Please try again.
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Recent Applicants</h5>
        </div>
        <div className="card-body">
          <p className="text-muted">No applicants data available yet. Use the Import function to add applicants.</p>
        </div>
      </div>
    );
  }
  
  // Get the most recent 10 applicants
  const recentApplicants = [...data].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  }).slice(0, 10);
  
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Recent Applicants</h5>
        <span className="badge bg-primary">{data.length} Total</span>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Status</th>
                <th scope="col">Company</th>
              </tr>
            </thead>
            <tbody>
              {recentApplicants.map((applicant) => (
                <tr key={applicant.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle bg-light text-dark d-flex align-items-center justify-content-center me-2" 
                        style={{ width: "32px", height: "32px" }}
                      >
                        <span>{applicant.initials}</span>
                      </div>
                      <div>{applicant.name}</div>
                    </div>
                  </td>
                  <td>{applicant.email}</td>
                  <td>
                    <span className={`badge bg-${getStatusColor(applicant.status)}`}>
                      {formatStatus(applicant.status)}
                    </span>
                  </td>
                  <td>{applicant.company || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-center mt-3">
          <button 
            type="button" 
            className="btn btn-outline-primary"
            data-bs-toggle="modal" 
            data-bs-target="#importAttendeesModal"
          >
            <i className="bi bi-upload me-2"></i>
            Import More Applicants
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format status
function formatStatus(status: string): string {
  switch (status) {
    case "registered":
      return "Registered";
    case "selected":
      return "Selected";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// Helper function to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case "registered":
      return "secondary";
    case "selected":
      return "primary";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "secondary";
  }
}