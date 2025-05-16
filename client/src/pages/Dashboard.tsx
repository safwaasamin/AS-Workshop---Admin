import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TopPerformers } from "@/components/TopPerformers";
import { ProgressChart } from "@/components/ProgressChart";
import { ApplicantList } from "@/components/ApplicantList";
import { ImportAttendees } from "@/components/ImportAttendees";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import { BarChart3, TrendingUp, Users, ReceiptText } from "lucide-react";

export default function Dashboard() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  
  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });
  
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: [`/api/events/${eventId}/stats`],
  });
  
  const { data: attendees, isLoading: attendeesLoading } = useQuery<any[]>({
    queryKey: [`/api/events/${eventId}/attendees`],
  });
  
  const { data: topPerformers, isLoading: topPerformersLoading } = useQuery<any[]>({
    queryKey: [`/api/events/${eventId}/top-performers`],
  });
  
  const isLoading = eventsLoading || statsLoading || attendeesLoading || topPerformersLoading;
  
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
    queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
    queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/top-performers`] });
  };
  
  if (isLoading) {
    return <Loading fullScreen />;
  }
  
  const eventName = events && events.length > 0 ? events[0].name : "AspiraSys Workshop System";
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="edumin-main">
        <Header eventName="Dashboard" />
        
        {/* Dashboard Content */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Workshop Overview</h2>
            <div className="flex gap-3">
              <button 
                className="edumin-btn edumin-btn-outline"
                onClick={refreshData}
              >
                <i className="bi bi-arrow-repeat me-2"></i>
                Refresh
              </button>
              <button 
                className="edumin-btn edumin-btn-primary"
                data-bs-toggle="modal" 
                data-bs-target="#importAttendeesModal"
              >
                <i className="bi bi-file-earmark-plus me-2"></i>
                Import Applicants
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Attendees Card */}
            <div className="stat-card primary-card">
              <div className="stat-title">Total Attendees</div>
              <div className="stat-value">{stats?.totalApplications || 0}</div>
              <div className="stat-icon">
                <Users />
              </div>
              <div className="stat-footer">
                {stats?.percentChange > 0 ? (
                  <span>↑ {stats?.percentChange}% since last month</span>
                ) : (
                  <span>No change since last month</span>
                )}
              </div>
            </div>
            
            {/* New Attendees Card */}
            <div className="stat-card warning-card">
              <div className="stat-title">New Attendees</div>
              <div className="stat-value">
                {stats?.newApplications || 0}
              </div>
              <div className="stat-icon">
                <Users />
              </div>
              <div className="stat-footer">
                In the last 30 days
              </div>
            </div>
            
            {/* Total Courses Card */}
            <div className="stat-card success-card">
              <div className="stat-title">Total Workshops</div>
              <div className="stat-value">{events?.length || 0}</div>
              <div className="stat-icon">
                <BarChart3 />
              </div>
              <div className="stat-footer">
                Currently active this month
              </div>
            </div>
            
            {/* Fees Collection Card */}
            <div className="stat-card danger-card">
              <div className="stat-title">Completed</div>
              <div className="stat-value">
                {stats?.participantsCompleted || 0}
              </div>
              <div className="stat-icon">
                <ReceiptText />
              </div>
              <div className="stat-footer">
                {stats?.completionRate}% completion rate
              </div>
            </div>
          </div>

          {/* Chart & Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Donut Chart */}
            <div className="chart-container">
              <h3 className="chart-title">Completion Rate</h3>
              <div className="flex flex-col items-center justify-center h-64">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#e5e7eb" 
                      strokeWidth="16" 
                    />
                    {/* Progress circle - using AspiraSys blue color */}
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#5A9BD5" 
                      strokeWidth="16" 
                      strokeDasharray={`${stats?.completionRate * 5.02} 502`} 
                      strokeDashoffset="125.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800">
                        {stats?.completionRate || 0}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Completion</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
                    <span className="text-sm text-gray-600">Remaining</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Line Chart */}
            <div className="chart-container">
              <h3 className="chart-title">Workshop Attendance</h3>
              <div className="h-64">
                {/* Simplified Line Chart - In a real app, use a chart library */}
                <div className="flex items-end h-52 mt-4 relative">
                  <div className="absolute inset-0 flex flex-col justify-between p-2">
                    <div className="border-b border-gray-200"></div>
                    <div className="border-b border-gray-200"></div>
                    <div className="border-b border-gray-200"></div>
                    <div className="border-b border-gray-200"></div>
                  </div>
                  <div className="w-1/7 h-20 bg-blue-400 opacity-60 mx-1 rounded-t-md"></div>
                  <div className="w-1/7 h-32 bg-blue-400 opacity-60 mx-1 rounded-t-md"></div>
                  <div className="w-1/7 h-24 bg-blue-400 opacity-60 mx-1 rounded-t-md"></div>
                  <div className="w-1/7 h-44 bg-blue-400 opacity-60 mx-1 rounded-t-md"></div>
                  <div className="w-1/7 h-40 bg-blue-400 opacity-60 mx-1 rounded-t-md"></div>
                  <div className="w-1/7 h-28 bg-blue-400 opacity-60 mx-1 rounded-t-md"></div>
                  <div className="w-1/7 h-36 bg-blue-400 opacity-60 mx-1 rounded-t-md"></div>
                </div>
                <div className="flex justify-between mt-2 px-2 text-xs text-gray-500">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performers */}
            <div className="lg:col-span-1">
              <div className="chart-container">
                <h3 className="chart-title">Top Performers</h3>
                <div className="overflow-hidden">
                  <table className="edumin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPerformers && topPerformers.length > 0 ? (
                        topPerformers.map((attendee: any, index: number) => (
                          <tr key={attendee.id}>
                            <td>
                              <div className="flex items-center">
                                <div className="avatar-initial rounded-full bg-primary-100 text-primary-700 mr-2">
                                  {attendee.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>{attendee.name}</div>
                              </div>
                            </td>
                            <td>
                              <span className="status-badge primary">{attendee.score || 0}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="text-center py-4">No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Recent Attendees */}
            <div className="lg:col-span-2">
              <div className="chart-container">
                <h3 className="chart-title">Recent Attendees</h3>
                <div className="overflow-hidden">
                  <table className="edumin-table">
                    <thead>
                      <tr>
                        <th>Attendee</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees && attendees.length > 0 ? (
                        attendees.slice(0, 5).map((attendee: any) => (
                          <tr key={attendee.id}>
                            <td>
                              <div className="flex items-center">
                                <div className="avatar-initial rounded-full bg-primary-100 text-primary-700 mr-2">
                                  {attendee.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>{attendee.name}</div>
                              </div>
                            </td>
                            <td>{attendee.email}</td>
                            <td>
                              <span className={`status-badge ${
                                attendee.status === 'registered' ? 'warning' : 
                                attendee.status === 'completed' ? 'success' : 
                                'primary'
                              }`}>
                                {attendee.status === 'registered' ? 'Registered' : 
                                 attendee.status === 'in_progress' ? 'In Progress' : 
                                 'Completed'}
                              </span>
                            </td>
                            <td>
                              {attendee.score || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4">No attendees found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Import Attendees Modal */}
          <ImportAttendees eventId={eventId} />
          
          <Footer />
        </div>
      </div>
    </div>
  );
}
