import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

interface TopPerformersProps {
  eventId: number;
}

export function TopPerformers({ eventId }: TopPerformersProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/top-performers`],
    enabled: !!eventId,
  });
  
  if (isLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading top performers. Please try again.
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Top Performers</h5>
        </div>
        <div className="card-body">
          <p className="text-muted">No performers data available yet.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0">Top Performers</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Score</th>
                <th scope="col">Completion Time</th>
              </tr>
            </thead>
            <tbody>
              {data.map((performer, index) => (
                <tr key={performer.id}>
                  <th scope="row">{index + 1}</th>
                  <td>
                    <div className="d-flex align-items-center">
                      <div 
                        className={`rounded-circle bg-${['primary', 'success', 'info', 'warning', 'danger'][index % 5]} text-white d-flex align-items-center justify-content-center me-2`} 
                        style={{ width: "32px", height: "32px" }}
                      >
                        <span>{performer.initials}</span>
                      </div>
                      <div>{performer.name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold text-success">{performer.score}</div>
                  </td>
                  <td>{performer.completionTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
