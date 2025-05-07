import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AttendeeTable } from "@/components/AttendeeTable";
import { ImportAttendees } from "@/components/ImportAttendees";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

export default function Attendees() {
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
            <h2 className="fw-bold">Attendee Management</h2>
            <div>
              <button 
                className="btn btn-primary" 
                data-bs-toggle="modal" 
                data-bs-target="#importAttendeesModal"
              >
                <i className="bi bi-upload me-2"></i>Import Attendees
              </button>
            </div>
          </div>

          {/* Attendee Table with Search and Filters */}
          <AttendeeTable eventId={eventId} />
          
          {/* Import Attendees Modal */}
          <ImportAttendees eventId={eventId} />
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
