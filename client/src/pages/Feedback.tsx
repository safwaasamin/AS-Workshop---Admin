import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeedbackSetup } from "@/components/FeedbackSetup";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

export default function Feedback() {
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
            <h2 className="fw-bold">Feedback Setup</h2>
            <div>
              <button className="btn btn-outline-secondary">
                <i className="bi bi-eye me-2"></i>View Responses
              </button>
            </div>
          </div>

          <div className="alert alert-info mb-4">
            <div className="d-flex">
              <div className="me-3">
                <i className="bi bi-info-circle-fill fs-4"></i>
              </div>
              <div>
                <h5>About Feedback Setup</h5>
                <p className="mb-0">
                  Create up to 10 questions for participants to answer. Questions can be rating-based (1-5) or free text responses.
                  Once set up, these questions will be shown to participants at the end of their event journey.
                </p>
              </div>
            </div>
          </div>

          <FeedbackSetup eventId={eventId} />
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
