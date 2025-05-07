import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

interface TaskMonitoringProps {
  eventId: number;
}

export function TaskMonitoring({ eventId }: TaskMonitoringProps) {
  const [activeTab, setActiveTab] = useState("all");
  
  // Get tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/tasks`],
    enabled: !!eventId,
  });
  
  // Get attendees
  const { data: attendees, isLoading: attendeesLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/attendees`],
    enabled: !!eventId,
  });
  
  if (tasksLoading || attendeesLoading) return <Loading />;
  
  // Create dummy task progress data for demo
  const dummyTaskProgress = tasks && attendees ? tasks.map(task => {
    const progress = {
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      attendees: [] as any[]
    };
    
    // Distribute attendees among progress states
    attendees.forEach((attendee, index) => {
      let status;
      if (index % 3 === 0) {
        status = "not_started";
        progress.notStarted += 1;
      } else if (index % 3 === 1) {
        status = "in_progress";
        progress.inProgress += 1;
      } else {
        status = "completed";
        progress.completed += 1;
      }
      
      progress.attendees.push({
        ...attendee,
        status,
        startTime: status !== "not_started" ? new Date(Date.now() - Math.random() * 86400000) : null,
        endTime: status === "completed" ? new Date() : null,
        mentorReview: status === "completed" ? "Good work!" : null,
        mentorRating: status === "completed" ? Math.floor(Math.random() * 3) + 3 : null
      });
    });
    
    return {
      task,
      progress
    };
  }) : [];
  
  // Filter by tab
  const filteredTasks = dummyTaskProgress?.filter(tp => {
    if (activeTab === "all") return true;
    if (activeTab === "in_progress") return tp.progress.inProgress > 0;
    if (activeTab === "completed") return tp.progress.completed > 0;
    return true;
  }) || [];
  
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3">
        <ul className="nav nav-tabs card-header-tabs">
          <li className="nav-item">
            <a 
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('all');
              }}
            >
              All Tasks
            </a>
          </li>
          <li className="nav-item">
            <a 
              className={`nav-link ${activeTab === 'in_progress' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('in_progress');
              }}
            >
              In Progress
            </a>
          </li>
          <li className="nav-item">
            <a 
              className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('completed');
              }}
            >
              Completed
            </a>
          </li>
        </ul>
      </div>
      <div className="card-body p-0">
        {filteredTasks.length === 0 ? (
          <div className="p-4 text-center text-muted">
            <i className="bi bi-clipboard-check fs-1 mb-3"></i>
            <p>No tasks found. Create tasks to start monitoring progress.</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {filteredTasks.map((tp, index) => (
              <div key={index} className="list-group-item p-4">
                <div className="mb-3 d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{tp.task.name}</h5>
                    <p className="text-muted mb-0">{tp.task.description}</p>
                  </div>
                  <span className="badge bg-primary">{tp.task.status}</span>
                </div>
                
                <div className="progress mb-3" style={{ height: "10px" }}>
                  <div 
                    className="progress-bar bg-danger" 
                    role="progressbar" 
                    style={{ width: `${tp.progress.notStarted / attendees!.length * 100}%` }} 
                    aria-valuenow={tp.progress.notStarted} 
                    aria-valuemin={0} 
                    aria-valuemax={attendees!.length}
                  ></div>
                  <div 
                    className="progress-bar bg-warning" 
                    role="progressbar" 
                    style={{ width: `${tp.progress.inProgress / attendees!.length * 100}%` }} 
                    aria-valuenow={tp.progress.inProgress} 
                    aria-valuemin={0} 
                    aria-valuemax={attendees!.length}
                  ></div>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: `${tp.progress.completed / attendees!.length * 100}%` }} 
                    aria-valuenow={tp.progress.completed} 
                    aria-valuemin={0} 
                    aria-valuemax={attendees!.length}
                  ></div>
                </div>
                
                <div className="row text-center mb-3">
                  <div className="col-4">
                    <h6 className="text-muted small text-uppercase">Not Started</h6>
                    <h5 className="mb-0 text-danger">{tp.progress.notStarted}</h5>
                  </div>
                  <div className="col-4">
                    <h6 className="text-muted small text-uppercase">In Progress</h6>
                    <h5 className="mb-0 text-warning">{tp.progress.inProgress}</h5>
                  </div>
                  <div className="col-4">
                    <h6 className="text-muted small text-uppercase">Completed</h6>
                    <h5 className="mb-0 text-success">{tp.progress.completed}</h5>
                  </div>
                </div>
                
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-bell me-2"></i>
                    Send Reminder
                  </button>
                  <button className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-people me-2"></i>
                    View Participants
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
