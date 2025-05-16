import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "./Logo";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <nav className={`edumin-sidebar ${className}`}>
      <div className="logo">
        <Logo />
      </div>
      
      {/* User profile */}
      <div className="px-5 py-4 flex items-center">
        <div className="avatar-initial rounded-full bg-primary-100 text-primary-700 mr-3">
          {user?.name ? user.name.substring(0, 2).toUpperCase() : "AS"}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</div>
          <div className="text-xs text-gray-500">Event Coordinator</div>
        </div>
      </div>
      
      <div className="nav-heading">Main Menu</div>
      
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link href="/">
            <a className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <i className="bi bi-speedometer2"></i>
              Dashboard
            </a>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/attendees">
            <a className={`nav-link ${isActive('/attendees') ? 'active' : ''}`}>
              <i className="bi bi-people"></i>
              Attendees
            </a>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/mentors">
            <a className={`nav-link ${isActive('/mentors') ? 'active' : ''}`}>
              <i className="bi bi-person-check"></i>
              Mentors
            </a>
          </Link>
        </li>
        
        <div className="nav-heading">Workshop</div>
        
        <li className="nav-item">
          <Link href="/feedback">
            <a className={`nav-link ${isActive('/feedback') ? 'active' : ''}`}>
              <i className="bi bi-chat-square-text"></i>
              Feedback
            </a>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/tasks">
            <a className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}>
              <i className="bi bi-list-check"></i>
              Tasks
            </a>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/reports">
            <a className={`nav-link ${isActive('/reports') ? 'active' : ''}`}>
              <i className="bi bi-file-earmark-bar-graph"></i>
              Reports
            </a>
          </Link>
        </li>
      </ul>
      
      <div className="px-4 mt-10">
        <button 
          onClick={() => logoutMutation.mutate()} 
          className="edumin-btn edumin-btn-outline w-full"
        >
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </div>
    </nav>
  );
}
