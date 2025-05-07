import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReportsGeneration } from "@/components/ReportsGeneration";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

export default function Reports() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  
  const { data: events, isLoading, error } = useQuery({
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
            <h2 className="fw-bold">Reports</h2>
          </div>

          <div className="alert alert-info mb-4">
            <div className="d-flex">
              <div className="me-3">
                <i className="bi bi-info-circle-fill fs-4"></i>
              </div>
              <div>
                <h5>About Report Generation</h5>
                <p className="mb-0">
                  Generate and download reports about event participants, their progress, scores, and feedback.
                  Reports can be downloaded in Excel or CSV format for further analysis.
                </p>
              </div>
            </div>
          </div>

          <ReportsGeneration eventId={eventId} />
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
