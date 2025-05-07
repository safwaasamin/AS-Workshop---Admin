import React from "react";
import { DashboardCard } from "./DashboardCard";
import { Loading } from "@/components/ui/loading";
import { useQuery } from "@tanstack/react-query";

interface DashboardStatsProps {
  eventId: number;
}

export function DashboardStats({ eventId }: DashboardStatsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/stats`],
    enabled: !!eventId,
  });
  
  if (isLoading) return <Loading text="Loading stats..." />;
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading dashboard stats. Please try again.
      </div>
    );
  }
  
  if (!data) return null;
  
  return (
    <div className="row g-4 mb-5">
      <div className="col-md-6 col-lg-3">
        <DashboardCard
          title="Total Applications"
          value={data.totalApplications}
          trend={data.applicationTrend}
          icon="file-earmark-text"
          iconColor="primary"
        />
      </div>
      
      <div className="col-md-6 col-lg-3">
        <DashboardCard
          title="Participants Started"
          value={data.participantsStarted}
          trend={data.startedTrend}
          icon="person-check"
          iconColor="success"
        />
      </div>
      
      <div className="col-md-6 col-lg-3">
        <DashboardCard
          title="Participants Completed"
          value={data.participantsCompleted}
          trend={data.completedTrend}
          icon="trophy"
          iconColor="info"
        />
      </div>
      
      <div className="col-md-6 col-lg-3">
        <DashboardCard
          title="Avg. Completion Rate"
          value={data.avgCompletionRate}
          trend={data.rateTrend}
          icon="graph-up"
          iconColor="warning"
        />
      </div>
    </div>
  );
}
