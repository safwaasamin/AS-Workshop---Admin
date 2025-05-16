import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ImportAttendees } from "@/components/ImportAttendees";
import { AttendeeForm } from "@/components/AttendeeForm";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { Filter, Plus, RefreshCw, Upload, Search } from "lucide-react";

export default function Attendees() {
  // For demo purposes, use event ID 1
  const eventId = 1;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAttendeeId, setDeleteAttendeeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { toast } = useToast();
  
  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });
  
  const { data: attendees, isLoading: attendeesLoading, error } = useQuery<any[]>({
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
  
  // Filter attendees based on search term and status
  const filteredAttendees = attendees ? attendees.filter(attendee => {
    const matchesSearch = searchTerm === '' || 
      attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attendee.company && attendee.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || attendee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];
  
  if (isLoading) {
    return <Loading fullScreen />;
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          Error loading data. Please try again.
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="edumin-main">
        <Header eventName="Attendee Management" />
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6 pt-2">
            <h2 className="text-2xl font-bold text-gray-800">Attendee List</h2>
            <div className="flex gap-3">
              <button 
                className="edumin-btn edumin-btn-outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button 
                className="edumin-btn edumin-btn-outline"
                data-bs-toggle="modal" 
                data-bs-target="#importAttendeesModal"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button 
                className="edumin-btn edumin-btn-primary"
                onClick={() => {
                  setEditingAttendee(null);
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Attendee
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="chart-container mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute top-0 left-0 h-full w-10 flex items-center justify-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="form-control h-10 pl-10 w-full rounded-md border border-gray-300 bg-white text-sm"
                    placeholder="Search by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <div className="relative">
                  <div className="absolute top-0 left-0 h-full w-10 flex items-center justify-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-500" />
                  </div>
                  <select
                    className="form-select h-10 pl-10 w-full rounded-md border border-gray-300 bg-white text-sm appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="registered">Registered</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendee List */}
            <div className="overflow-x-auto">
              <table className="edumin-table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.length > 0 ? (
                    filteredAttendees.map((attendee: any) => (
                      <tr key={attendee.id}>
                        <td>
                          <div className="flex items-center">
                            <div className="avatar-initial rounded-full bg-primary-100 text-primary-700 mr-3">
                              {attendee.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <div className="font-medium">{attendee.name}</div>
                          </div>
                        </td>
                        <td>{attendee.email}</td>
                        <td>{attendee.company || '-'}</td>
                        <td>
                          <span className={`status-badge ${
                            attendee.status === 'registered' ? 'warning' : 
                            attendee.status === 'in_progress' ? 'primary' : 
                            'success'
                          }`}>
                            {attendee.status === 'registered' ? 'Registered' : 
                             attendee.status === 'in_progress' ? 'In Progress' : 
                             'Completed'}
                          </span>
                        </td>
                        <td>{attendee.score || '-'}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleEdit(attendee)}
                            >
                              <i className="bi bi-pencil text-blue-600"></i>
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleDelete(attendee.id)}
                            >
                              <i className="bi bi-trash text-red-600"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="text-gray-500 mb-2">No attendees found</div>
                        <button 
                          className="edumin-btn edumin-btn-outline"
                          onClick={() => {
                            setEditingAttendee(null);
                            setShowCreateModal(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Attendee
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                    className="edumin-btn edumin-btn-outline"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="edumin-btn edumin-btn-primary bg-red-600 hover:bg-red-700"
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" aria-hidden="true"></span>
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
      </div>
    </div>
  );
}