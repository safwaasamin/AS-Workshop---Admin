import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <nav className={`sidebar bg-dark text-white col-md-3 col-lg-2 d-md-block ${className}`}>
      <div className="position-sticky pt-3">
        <div className="p-3 mb-4 border-bottom border-secondary">
          <h5 className="text-uppercase fw-bold text-center">AspiraSys IT Workshop</h5>
          <p className="text-center text-white-50 small mb-0">Event Coordinator</p>
        </div>
        
        <ul className="nav flex-column px-3">
          <li className="nav-item">
            <Link href="/">
              <div className={`nav-link text-white ${isActive('/') ? 'active' : ''} cursor-pointer`}>
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </div>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/attendees">
              <div className={`nav-link text-white ${isActive('/attendees') ? 'active' : ''} cursor-pointer`}>
                <i className="bi bi-people me-2"></i>
                Attendee Management
              </div>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/mentors">
              <div className={`nav-link text-white ${isActive('/mentors') ? 'active' : ''} cursor-pointer`}>
                <i className="bi bi-person-check me-2"></i>
                Mentor Assignment
              </div>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/feedback">
              <div className={`nav-link text-white ${isActive('/feedback') ? 'active' : ''} cursor-pointer`}>
                <i className="bi bi-chat-square-text me-2"></i>
                Feedback Setup
              </div>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/tasks">
              <div className={`nav-link text-white ${isActive('/tasks') ? 'active' : ''} cursor-pointer`}>
                <i className="bi bi-list-check me-2"></i>
                Task Monitoring
              </div>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/reports">
              <div className={`nav-link text-white ${isActive('/reports') ? 'active' : ''} cursor-pointer`}>
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                Reports
              </div>
            </Link>
          </li>
        </ul>
        
        <div className="px-3 mt-5 pt-5">
          <button onClick={() => logoutMutation.mutate()} className="btn btn-outline-light w-100">
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
