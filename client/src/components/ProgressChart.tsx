import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

interface ProgressChartProps {
  eventId: number;
}

export function ProgressChart({ eventId }: ProgressChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/stats`],
    enabled: !!eventId,
  });
  
  if (isLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading progress data. Please try again.
      </div>
    );
  }
  
  if (!data) return null;
  
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Progress Overview</h5>
        <div className="dropdown">
          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            This Week
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><a className="dropdown-item" href="#">Today</a></li>
            <li><a className="dropdown-item" href="#">This Week</a></li>
            <li><a className="dropdown-item" href="#">This Month</a></li>
            <li><a className="dropdown-item" href="#">Custom Range</a></li>
          </ul>
        </div>
      </div>
      <div className="card-body">
        <div className="progress-chart" style={{ height: "300px", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div className="position-relative w-100 h-100">
            <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
              <div className="d-flex justify-content-around px-5 w-100">
                <div className="progress-pie" style={{ width: "100px", height: "100px", position: "relative" }}>
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle" 
                      style={{ stroke: "#dc3545", fill: "none", strokeWidth: "2.8", strokeLinecap: "round", strokeDasharray: `${parseInt(data.progressStats.notStarted)}`, strokeDashoffset: "0" }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage" style={{ fill: "#dc3545", fontSize: "0.5em", textAnchor: "middle" }}>
                      {data.progressStats.notStarted}
                    </text>
                  </svg>
                  <span className="mt-2 d-block text-danger">Not Started</span>
                </div>
                
                <div className="progress-pie" style={{ width: "100px", height: "100px", position: "relative" }}>
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle" 
                      style={{ stroke: "#ffc107", fill: "none", strokeWidth: "2.8", strokeLinecap: "round", strokeDasharray: `${parseInt(data.progressStats.inProgress)}`, strokeDashoffset: "0" }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage" style={{ fill: "#ffc107", fontSize: "0.5em", textAnchor: "middle" }}>
                      {data.progressStats.inProgress}
                    </text>
                  </svg>
                  <span className="mt-2 d-block text-warning">In Progress</span>
                </div>
                
                <div className="progress-pie" style={{ width: "100px", height: "100px", position: "relative" }}>
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle" 
                      style={{ stroke: "#198754", fill: "none", strokeWidth: "2.8", strokeLinecap: "round", strokeDasharray: `${parseInt(data.progressStats.completed)}`, strokeDashoffset: "0" }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage" style={{ fill: "#198754", fontSize: "0.5em", textAnchor: "middle" }}>
                      {data.progressStats.completed}
                    </text>
                  </svg>
                  <span className="mt-2 d-block text-success">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-4 text-center">
          <div className="col-4">
            <h6 className="text-muted small text-uppercase">Not Started</h6>
            <h4 className="mb-0 text-danger">{data.progressStats.notStarted}</h4>
          </div>
          <div className="col-4">
            <h6 className="text-muted small text-uppercase">In Progress</h6>
            <h4 className="mb-0 text-warning">{data.progressStats.inProgress}</h4>
          </div>
          <div className="col-4">
            <h6 className="text-muted small text-uppercase">Completed</h6>
            <h4 className="mb-0 text-success">{data.progressStats.completed}</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
