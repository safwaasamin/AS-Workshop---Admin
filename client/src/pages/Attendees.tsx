import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AttendeeTable } from "@/components/AttendeeTable";
import { ImportAttendees } from "@/components/ImportAttendees";
import { AttendeeForm } from "@/components/AttendeeForm";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";

export default function Attendees() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAttendeeId, setDeleteAttendeeId] = useState<number | null>(null);
  
  const { toast } = useToast();
  
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events'],
  });
  
  const { data: attendees, isLoading: attendeesLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/attendees`],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/attendees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
      toast({
        title: "Success",
        description: "Attendee deleted successfully",
      });
      setShowDeleteModal(false);
      setDeleteAttendeeId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete attendee: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    setDeleteAttendeeId(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (deleteAttendeeId) {
      deleteMutation.mutate(deleteAttendeeId);
    }
  };
  
  const handleEdit = (attendee: any) => {
    setEditingAttendee(attendee);
    setShowCreateModal(true);
  };
  
  const isLoading = eventsLoading || attendeesLoading;
  
  if (isLoading) {
    return <Loading fullScreen />;
  }
  
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger" role="alert">
          Error loading data. Please try again.
        </div>
      </div>
    );
  }
  
  return (
    <div className="d-flex">
      <Sidebar />
      
      <main id="page-content" className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
        <Header eventName={events && events[0] ? events[0].name : "AspiraSys Workshop System"} />
        
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Attendee Management</h2>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setEditingAttendee(null);
                  setShowCreateModal(true);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>Add Attendee
              </button>
              <button 
                className="btn btn-outline-primary" 
                data-bs-toggle="modal" 
                data-bs-target="#importAttendeesModal"
              >
                <i className="bi bi-upload me-2"></i>Import Attendees
              </button>
            </div>
          </div>

          {/* Attendee List */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Company</th>
                      <th scope="col">Status</th>
                      <th scope="col">Score</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees && attendees.length > 0 ? (
                      attendees.map((attendee: any) => (
                        <tr key={attendee.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-initial rounded-circle me-2 bg-primary text-white">
                                {attendee.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>{attendee.name}</div>
                            </div>
                          </td>
                          <td>{attendee.email}</td>
                          <td>{attendee.company || '-'}</td>
                          <td>
                            <span className={`badge ${
                              attendee.status === 'registered' ? 'bg-secondary' : 
                              attendee.status === 'in_progress' ? 'bg-primary' : 
                              'bg-success'
                            }`}>
                              {attendee.status === 'registered' ? 'Registered' : 
                               attendee.status === 'in_progress' ? 'In Progress' : 
                               'Completed'}
                            </span>
                          </td>
                          <td>{attendee.score || '-'}</td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(attendee)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(attendee.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <div className="text-muted">No attendees found</div>
                          <button 
                            className="btn btn-sm btn-outline-primary mt-2"
                            onClick={() => {
                              setEditingAttendee(null);
                              setShowCreateModal(true);
                            }}
                          >
                            Add Attendee
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Import Attendees Modal */}
          <ImportAttendees eventId={eventId} />
          
          {/* Create/Edit Attendee Modal */}
          <div className={`modal fade ${showCreateModal ? 'show' : ''}`} 
            id="attendeeFormModal" 
            tabIndex={-1}
            style={{ display: showCreateModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingAttendee ? 'Edit Attendee' : 'Add Attendee'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowCreateModal(false)}
                  ></button>
                </div>
                <AttendeeForm 
                  eventId={eventId} 
                  attendee={editingAttendee}
                  onClose={() => setShowCreateModal(false)}
                />
              </div>
            </div>
          </div>
          
          {/* Delete Confirmation Modal */}
          <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} 
            id="deleteConfirmModal" 
            tabIndex={-1}
            style={{ display: showDeleteModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Attendee</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this attendee? This action cannot be undone.</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <Footer />
        </div>
      </main>
    </div>
  );
}
