import React from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend: string;
  icon: string;
  iconColor: string;
}

export function DashboardCard({ title, value, trend, icon, iconColor }: DashboardCardProps) {
  return (
    <div className="card dashboard-card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="text-muted text-uppercase fs-6">{title}</h6>
            <h2 className="fw-bold mt-2 mb-0">{value}</h2>
          </div>
          <div className={`rounded-circle bg-${iconColor} bg-opacity-10 p-3`}>
            <i className={`bi bi-${icon} text-${iconColor} fs-4`}></i>
          </div>
        </div>
        <div className="mt-3 text-success small">
          <i className="bi bi-graph-up-arrow"></i>
          <span> {trend}</span>
        </div>
      </div>
    </div>
  );
}
