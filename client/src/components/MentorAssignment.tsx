import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";

interface MentorAssignmentProps {
  eventId: number;
}

export function MentorAssignment({ eventId }: MentorAssignmentProps) {
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<number[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  
  const queryClient = useQueryClient();
  
  // Get mentor and attendee data
  const { data: mentors, isLoading: mentorsLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/mentors`],
    enabled: !!eventId,
  });
  
  const { data: attendees, isLoading: attendeesLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/attendees`],
    enabled: !!eventId,
  });
  
  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (data: { mentorId: number, attendeeIds: number[], sendNotification: boolean }) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/assign-mentors`, data);
      return response.json();
    },
    onSuccess: () => {
      // Reset selected attendees
      setSelectedAttendeeIds([]);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/mentors`] });
    }
  });
  
  // Handlers
  const handleMentorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMentorId(Number(e.target.value) || null);
  };
  
  const handleAttendeeSelect = (attendeeId: number) => {
    if (selectedAttendeeIds.includes(attendeeId)) {
      setSelectedAttendeeIds(selectedAttendeeIds.filter(id => id !== attendeeId));
    } else {
      setSelectedAttendeeIds([...selectedAttendeeIds, attendeeId]);
    }
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const unassignedIds = attendees
        ?.filter(a => !a.mentorId)
        .map(a => a.id) || [];
      setSelectedAttendeeIds(unassignedIds);
    } else {
      setSelectedAttendeeIds([]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMentorId || selectedAttendeeIds.length === 0) {
      // Show error or alert
      return;
    }
    
    assignMutation.mutate({
      mentorId: selectedMentorId,
      attendeeIds: selectedAttendeeIds,
      sendNotification
    });
  };
  
  if (mentorsLoading || attendeesLoading) return <Loading />;
  
  // Filter for unassigned attendees
  const unassignedAttendees = attendees?.filter(a => !a.mentorId) || [];
  
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0">Manual Assignment</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="selectMentor" className="form-label">Select Mentor</label>
            <select 
              className="form-select" 
              id="selectMentor"
              value={selectedMentorId || ""}
              onChange={handleMentorChange}
            >
              <option value="">Choose a mentor...</option>
              {mentors && mentors.map(mentor => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name} ({mentor.assignedCount} assigned)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Assign Participants</label>
            {unassignedAttendees.length === 0 ? (
              <div className="alert alert-info">
                All participants are already assigned to mentors.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="selectAllParticipants"
                            checked={selectedAttendeeIds.length === unassignedAttendees.length && unassignedAttendees.length > 0}
                            onChange={handleSelectAll}
                          />
                          <label className="form-check-label" htmlFor="selectAllParticipants"></label>
                        </div>
                      </th>
                      <th scope="col">Name</th>
                      <th scope="col">Current Status</th>
                      <th scope="col">Current Mentor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedAttendees.map(attendee => (
                      <tr key={attendee.id}>
                        <td>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox"
                              checked={selectedAttendeeIds.includes(attendee.id)}
                              onChange={() => handleAttendeeSelect(attendee.id)}
                            />
                            <label className="form-check-label"></label>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold">{attendee.name}</div>
                          <div className="small text-muted">{attendee.email}</div>
                        </td>
                        <td>
                          <span className={`badge bg-${
                            attendee.status === 'completed' ? 'success' : 
                            attendee.status === 'in_progress' ? 'warning' : 
                            'danger'
                          } status-badge`}>
                            {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted">Not Assigned</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-check mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="sendAssignmentEmails"
              checked={sendNotification}
              onChange={() => setSendNotification(!sendNotification)}
            />
            <label className="form-check-label" htmlFor="sendAssignmentEmails">
              Send notification emails to participants and mentors
            </label>
          </div>

          <div className="d-grid">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!selectedMentorId || selectedAttendeeIds.length === 0 || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Assigning...
                </>
              ) : 'Assign Selected Participants'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
