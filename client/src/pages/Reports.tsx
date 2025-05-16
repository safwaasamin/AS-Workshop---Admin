import { useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";
import { Download, FileText, Filter, Printer, Search } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

export default function Reports() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  const reportsRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState<string>("task");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });
  
  const { data: attendees, isLoading: attendeesLoading } = useQuery<any[]>({
    queryKey: [`/api/events/${eventId}/attendees`],
  });
  
  const { data: tasks, isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: [`/api/events/${eventId}/tasks`],
  });
  
  const { data: reports, isLoading: reportsLoading } = useQuery<any>({
    queryKey: [`/api/events/${eventId}/reports`],
  });
  
  const isLoading = eventsLoading || attendeesLoading || tasksLoading || reportsLoading;
  
  const exportToPDF = async () => {
    if (!reportsRef.current) return;
    
    try {
      const canvas = await html2canvas(reportsRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`AspiraSys_${reportType}_report.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };
  
  const exportToExcel = () => {
    // This is a placeholder for Excel export functionality
    // In a real implementation, you would use a library like xlsx to export the data
    alert("Excel export functionality would be implemented here");
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'registered':
        return 'bg-blue-500';
      case 'created':
        return 'bg-blue-800';
      case 'draft':
        return 'bg-cyan-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getProgressBar = (progress: number) => {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-green-500 h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };
  
  const renderPriorityStars = (priority: string) => {
    const starCount = priority === 'High' ? 3 : (priority === 'Medium' ? 2 : 1);
    
    return (
      <div className="flex">
        {Array(5).fill(0).map((_, i) => (
          <span key={i} className={i < starCount ? "text-yellow-400" : "text-gray-300"}>★</span>
        ))}
      </div>
    );
  };
  
  const filteredAttendees = attendees ? attendees.filter(attendee => 
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendee.company && attendee.company.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];
  
  if (isLoading) {
    return <Loading fullScreen />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="edumin-main">
        <Header eventName="Reports" />
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6 pt-2">
            <h2 className="text-2xl font-bold text-gray-800">Workshop Reports</h2>
            <div className="flex gap-3">
              <select 
                className="form-select h-10 px-4 rounded-md border border-gray-300 bg-white text-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="task">Task Status Report</option>
                <option value="attendee">Attendee Progress Report</option>
                <option value="summary">Workshop Summary Report</option>
              </select>
              <button 
                className="edumin-btn edumin-btn-outline"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button 
                className="edumin-btn edumin-btn-outline"
                onClick={exportToExcel}
              >
                <FileText className="w-4 h-4 mr-2" />
                Excel
              </button>
              <button 
                className="edumin-btn edumin-btn-primary"
                onClick={exportToPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute top-0 left-0 h-full w-10 flex items-center justify-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                className="form-control h-10 pl-10 w-full rounded-md border border-gray-300 bg-white text-sm"
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Report Content */}
          <div className="chart-container" ref={reportsRef}>
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h1 className="text-xl font-bold text-center text-gray-800">
                {reportType === 'task' ? 'Task Status Report with Progress Percentage' : 
                 reportType === 'attendee' ? 'Attendee Progress Report' : 
                 'Workshop Summary Report'}
              </h1>
            </div>
            
            {/* Task Status Report */}
            {reportType === 'task' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="p-3 text-left border border-gray-300">Task ID</th>
                      <th className="p-3 text-left border border-gray-300">Assigned to</th>
                      <th className="p-3 text-left border border-gray-300">Priority</th>
                      <th className="p-3 text-left border border-gray-300">Status</th>
                      <th className="p-3 text-left border border-gray-300">Complete Progress</th>
                      <th className="p-3 text-left border border-gray-300">Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks && tasks.length > 0 ? (
                      tasks.map((task, index) => (
                        <tr key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 border border-gray-300">{String(task.id).padStart(2, '0')}</td>
                          <td className="p-3 border border-gray-300">{task.assignedTo || 'Unassigned'}</td>
                          <td className="p-3 border border-gray-300">
                            {task.priority ? renderPriorityStars(task.priority) : 'Low'}
                          </td>
                          <td className="p-3 border border-gray-300">
                            <div className="flex items-center">
                              <span 
                                className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(task.status)}`}
                              ></span>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </div>
                          </td>
                          <td className="p-3 border border-gray-300">
                            <div>
                              {getProgressBar(task.progress || 0)}
                              <div className="text-right text-xs mt-1">{task.progress || 0}%</div>
                            </div>
                          </td>
                          <td className="p-3 border border-gray-300">
                            {task.info || 'No additional information'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">No tasks available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Attendee Progress Report */}
            {reportType === 'attendee' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="p-3 text-left border border-gray-300">ID</th>
                      <th className="p-3 text-left border border-gray-300">Name</th>
                      <th className="p-3 text-left border border-gray-300">Email</th>
                      <th className="p-3 text-left border border-gray-300">Company</th>
                      <th className="p-3 text-left border border-gray-300">Status</th>
                      <th className="p-3 text-left border border-gray-300">Score</th>
                      <th className="p-3 text-left border border-gray-300">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendees.length > 0 ? (
                      filteredAttendees.map((attendee, index) => (
                        <tr key={attendee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 border border-gray-300">{String(attendee.id).padStart(2, '0')}</td>
                          <td className="p-3 border border-gray-300">
                            <div className="flex items-center">
                              <div className="avatar-initial rounded-full bg-primary-100 text-primary-700 mr-2">
                                {attendee.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              {attendee.name}
                            </div>
                          </td>
                          <td className="p-3 border border-gray-300">{attendee.email}</td>
                          <td className="p-3 border border-gray-300">{attendee.company || '-'}</td>
                          <td className="p-3 border border-gray-300">
                            <div className="flex items-center">
                              <span 
                                className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(attendee.status)}`}
                              ></span>
                              {attendee.status === 'registered' ? 'Registered' : 
                               attendee.status === 'in_progress' ? 'In Progress' : 
                               'Completed'}
                            </div>
                          </td>
                          <td className="p-3 border border-gray-300">{attendee.score || '-'}</td>
                          <td className="p-3 border border-gray-300">
                            <div>
                              {getProgressBar(attendee.score || 0)}
                              <div className="text-right text-xs mt-1">{attendee.score || 0}%</div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">No attendees found matching your search criteria</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Workshop Summary Report */}
            {reportType === 'summary' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Attendance Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Registered:</span>
                        <span className="font-medium">{reports?.attendeeCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started Workshop:</span>
                        <span className="font-medium">{reports?.participantsStarted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed Workshop:</span>
                        <span className="font-medium">{reports?.participantsCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completion Rate:</span>
                        <span className="font-medium text-green-600">{reports?.completionRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Performance Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Score:</span>
                        <span className="font-medium">{reports?.averageScore || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Highest Score:</span>
                        <span className="font-medium text-green-600">{reports?.highestScore || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lowest Score:</span>
                        <span className="font-medium text-red-600">{reports?.lowestScore || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasks Completed:</span>
                        <span className="font-medium">{reports?.tasksCompleted || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-md border border-gray-200 mb-6">
                  <h3 className="text-lg font-semibold mb-3">Top Performers</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Company</th>
                        <th className="p-2 text-left">Score</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(attendees || []).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5).map((attendee) => (
                        <tr key={attendee.id} className="border-t border-gray-200">
                          <td className="p-2">
                            <div className="flex items-center">
                              <div className="avatar-initial rounded-full bg-primary-100 text-primary-700 mr-2 h-6 w-6 text-xs">
                                {attendee.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              {attendee.name}
                            </div>
                          </td>
                          <td className="p-2">{attendee.company || '-'}</td>
                          <td className="p-2 font-medium">{attendee.score || 0}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs 
                              ${attendee.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                attendee.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {attendee.status === 'registered' ? 'Registered' : 
                               attendee.status === 'in_progress' ? 'In Progress' : 
                               'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <h3 className="text-lg font-semibold mb-3">Task Completion Status</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 text-left">Task</th>
                          <th className="p-2 text-left">Completion Rate</th>
                          <th className="p-2 text-left">Avg. Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(tasks || []).map((task) => (
                          <tr key={task.id} className="border-t border-gray-200">
                            <td className="p-2">{task.name}</td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className="bg-green-500 h-2.5 rounded-full" 
                                    style={{ width: `${task.progress || 0}%` }}
                                  ></div>
                                </div>
                                <span>{task.progress || 0}%</span>
                              </div>
                            </td>
                            <td className="p-2">{task.averageScore || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} AspiraSys Workshop System. All rights reserved.</p>
              <p className="mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          
          <Footer />
        </div>
      </div>
    </div>
  );
}