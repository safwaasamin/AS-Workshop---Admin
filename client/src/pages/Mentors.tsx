import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MentorList } from "@/components/MentorList";
import { MentorAssignment } from "@/components/MentorAssignment";
import { MentorForm } from "@/components/MentorForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";

export default function Mentors() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMentorId, setDeleteMentorId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });
  
  const { data: mentors, isLoading: mentorsLoading, error } = useQuery<any[]>({
    queryKey: [`/api/events/${eventId}/mentors`],
  });
  
  // Delete mentor mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/mentors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/mentors`] });
      toast({
        title: "Success",
        description: "Mentor deleted successfully",
      });
      setShowDeleteModal(false);
      setDeleteMentorId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete mentor: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Auto-assign mentors (for demo, just show a toast)
  const handleAutoAssign = () => {
    toast({
      title: "Auto-Assignment",
      description: "Auto-assignment would be implemented here in a real application.",
    });
  };
  
  const handleDelete = (id: number) => {
    setDeleteMentorId(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (deleteMentorId) {
      deleteMutation.mutate(deleteMentorId);
    }
  };
  
  const handleEdit = (mentor: any) => {
    setEditingMentor(mentor);
    setShowMentorModal(true);
  };
  
  const isLoading = eventsLoading || mentorsLoading;
  
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
        <Header eventName={events && events.length > 0 ? events[0].name : "AspiraSys Workshop System"} />
        
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Mentor Management</h2>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setEditingMentor(null);
                  setShowMentorModal(true);
                }}
              >
                <i className="bi bi-person-plus me-2"></i>Add Mentor
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAutoAssign}
              >
                <i className="bi bi-link me-2"></i>Auto-Assign Mentors
              </button>
            </div>
          </div>

          <div className="row g-4">
            {/* Mentors List with CRUD capability */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="card-title mb-0">Available Mentors</h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">Name</th>
                          <th scope="col">Expertise</th>
                          <th scope="col">Assigned</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mentors && mentors.length > 0 ? (
                          mentors.map((mentor: any) => (
                            <tr key={mentor.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-initial rounded-circle me-2 bg-primary text-white">
                                    {mentor.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                                  </div>
                                  <div className="d-flex flex-column">
                                    <div className="fw-medium">{mentor.name}</div>
                                    <small className="text-muted">{mentor.email}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{mentor.expertise}</td>
                              <td>
                                <span className="badge bg-primary">
                                  {mentor.assignedCount || 0}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleEdit(mentor)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(mentor.id)}
                                    disabled={mentor.assignedCount > 0}
                                    title={mentor.assignedCount > 0 ? "Cannot delete mentor with assigned attendees" : "Delete mentor"}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-4">
                              <div className="text-muted">No mentors found</div>
                              <button 
                                className="btn btn-sm btn-outline-primary mt-2"
                                onClick={() => {
                                  setEditingMentor(null);
                                  setShowMentorModal(true);
                                }}
                              >
                                Add Mentor
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Interface */}
            <div className="col-lg-7">
              <MentorAssignment eventId={eventId} />
            </div>
          </div>
          
          {/* Create/Edit Mentor Modal */}
          <div className={`modal fade ${showMentorModal ? 'show' : ''}`} 
            id="mentorFormModal" 
            tabIndex={-1}
            style={{ display: showMentorModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingMentor ? 'Edit Mentor' : 'Add Mentor'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowMentorModal(false)}
                  ></button>
                </div>
                <MentorForm 
                  eventId={eventId} 
                  mentor={editingMentor}
                  onClose={() => setShowMentorModal(false)}
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
                  <h5 className="modal-title">Delete Mentor</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this mentor? This action cannot be undone.</p>
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
