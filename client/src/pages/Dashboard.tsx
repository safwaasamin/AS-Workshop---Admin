import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DashboardStats } from "@/components/DashboardStats";
import { TopPerformers } from "@/components/TopPerformers";
import { ProgressChart } from "@/components/ProgressChart";
import { ApplicantList } from "@/components/ApplicantList";
import { ImportAttendees } from "@/components/ImportAttendees";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

export default function Dashboard() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  
  const { data: events, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });
  
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
            <h2 className="fw-bold">Dashboard</h2>
            <div>
              <button className="btn btn-outline-secondary">
                <i className="bi bi-arrow-repeat me-2"></i>Refresh Data
              </button>
            </div>
          </div>

          {/* Dashboard Stats Cards */}
          <DashboardStats eventId={eventId} />

          {/* Dashboard Charts and Tables */}
          <div className="row g-4">
            {/* Top Performers Table */}
            <div className="col-lg-6">
              <TopPerformers eventId={eventId} />
            </div>

            {/* Progress Overview */}
            <div className="col-lg-6">
              <ProgressChart eventId={eventId} />
            </div>
          </div>

          {/* Applicant List */}
          <div className="row mt-4">
            <div className="col-12">
              <ApplicantList eventId={eventId} />
            </div>
          </div>
          
          {/* Import Attendees Modal */}
          <ImportAttendees eventId={eventId} />
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
