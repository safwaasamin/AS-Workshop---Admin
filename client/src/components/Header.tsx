import React from "react";
import { useCurrentUser, useLogout } from "@/lib/auth";

interface HeaderProps {
  eventName?: string;
}

export function Header({ eventName = "Tech Conference 2023" }: HeaderProps) {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom py-3">
      <div className="container-fluid">
        <button className="navbar-toggler d-md-none" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar">
          <span className="navbar-toggler-icon"></span>
        </button>
        <h5 className="navbar-brand mb-0">Admin Panel | {eventName}</h5>
        <div className="ms-auto d-flex align-items-center">
          <div className="dropdown">
            <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
              <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: "32px", height: "32px" }}>
                <i className="bi bi-person"></i>
              </div>
              <span>{isLoading ? "Loading..." : user?.name || "Admin User"}</span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><a className="dropdown-item" href="#profile">Profile</a></li>
              <li><a className="dropdown-item" href="#settings">Settings</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="#" onClick={logout}>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
