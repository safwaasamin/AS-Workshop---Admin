import { useAuth } from "@/hooks/use-auth";
import { Bell, Menu, Search, Settings, Sun } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

interface HeaderProps {
  eventName?: string;
  toggleSidebar?: () => void;
}

export function Header({ eventName = "Dashboard", toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "AU";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <header className="edumin-header">
      {/* Mobile Menu Toggle */}
      <div className="flex md:hidden mr-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </button>
      </div>
      
      {/* Page Title / Current View */}
      <div className="hidden md:block">
        <h1 className="text-xl font-semibold text-gray-900">{eventName}</h1>
      </div>
      
      {/* Search Box */}
      <div className="search-box ml-auto mr-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-500" />
        </div>
        <input 
          type="text" 
          placeholder="Search..." 
          className="h-9 pl-10 pr-4 rounded-md border border-gray-300 bg-white text-sm w-full"
        />
      </div>
      
      {/* Action Icons */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <Sun className="w-4 h-4 text-gray-600" />
        </button>
        
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 relative">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
        
        {/* User Profile */}
        <div className="relative group">
          <button 
            className="flex items-center rounded-full hover:bg-gray-100 p-1"
            onClick={(e) => {
              e.preventDefault();
              const dropdown = document.getElementById('user-dropdown');
              if (dropdown) {
                dropdown.classList.toggle('hidden');
              }
            }}
          >
            <div className="avatar-initial rounded-full bg-primary-100 text-primary-700">
              {getInitials(user?.name)}
            </div>
          </button>
          
          {/* Dropdown Menu */}
          <div 
            id="user-dropdown"
            className="hidden absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10"
          >
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-gray-900">{user?.name || "Admin User"}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <hr className="my-1" />
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Profile</button>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Settings</button>
            <hr className="my-1" />
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
