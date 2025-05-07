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
          <h5 className="text-uppercase fw-bold text-center">Event Coordinator</h5>
        </div>
        
        <ul className="nav flex-column px-3">
          <li className="nav-item">
            <Link href="/">
              <a className={`nav-link text-white ${isActive('/') ? 'active' : ''}`}>
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </a>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/attendees">
              <a className={`nav-link text-white ${isActive('/attendees') ? 'active' : ''}`}>
                <i className="bi bi-people me-2"></i>
                Attendee Management
              </a>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/mentors">
              <a className={`nav-link text-white ${isActive('/mentors') ? 'active' : ''}`}>
                <i className="bi bi-person-check me-2"></i>
                Mentor Assignment
              </a>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/feedback">
              <a className={`nav-link text-white ${isActive('/feedback') ? 'active' : ''}`}>
                <i className="bi bi-chat-square-text me-2"></i>
                Feedback Setup
              </a>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/tasks">
              <a className={`nav-link text-white ${isActive('/tasks') ? 'active' : ''}`}>
                <i className="bi bi-list-check me-2"></i>
                Task Monitoring
              </a>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/reports">
              <a className={`nav-link text-white ${isActive('/reports') ? 'active' : ''}`}>
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                Reports
              </a>
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
