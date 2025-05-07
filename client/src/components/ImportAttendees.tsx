import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ImportAttendeesProps {
  eventId: number;
}

export function ImportAttendees({ eventId }: ImportAttendeesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [generateCredentials, setGenerateCredentials] = useState(true);
  const [sendInvitations, setSendInvitations] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  
  const queryClient = useQueryClient();
  
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/events/${eventId}/import-attendees`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import attendees");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
      
      // Reset form and close modal
      setFile(null);
      setError("");
      
      // Close modal using DOM API instead of Bootstrap's API
      const modal = document.getElementById('importAttendeesModal');
      if (modal) {
        // Use bootstrap modal API
        const bsModal = window.bootstrap?.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        } else {
          // Fallback to clicking the close button
          const closeButton = modal.querySelector('.btn-close');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        }
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      setError("Please upload a CSV or Excel file (xlsx, xls)");
      return;
    }
    
    setIsUploading(true);
    setError("");
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('generateCredentials', generateCredentials.toString());
    formData.append('sendInvitations', sendInvitations.toString());
    
    importMutation.mutate(formData);
  };
  
  return (
    <div className="modal fade" id="importAttendeesModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import Attendees</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <p>Upload a CSV or Excel file with attendee data. The file should include the following headers:</p>
              <ul className="small text-muted">
                <li>Name (required)</li>
                <li>Email (required)</li>
                <li>Company (optional)</li>
                <li>Position (optional)</li>
                <li>Phone (optional)</li>
              </ul>
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="attendeeFile" className="form-label">Select File</label>
                <input 
                  className="form-control" 
                  type="file" 
                  id="attendeeFile" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                />
                {file && (
                  <div className="mt-2">
                    <span className="text-muted">Selected file: {file.name}</span>
                  </div>
                )}
              </div>
              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="generateCredentials"
                  checked={generateCredentials}
                  onChange={() => setGenerateCredentials(!generateCredentials)}
                />
                <label className="form-check-label" htmlFor="generateCredentials">
                  Auto-generate login credentials
                </label>
                <div className="form-text small text-muted">
                  Email address will be used as login ID, and random passwords will be auto-generated.
                  You can download the credentials list after import.
                </div>
              </div>
              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="sendInvitationEmails"
                  checked={sendInvitations}
                  onChange={() => setSendInvitations(!sendInvitations)}
                />
                <label className="form-check-label" htmlFor="sendInvitationEmails">
                  Send invitation emails to attendees
                </label>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isUploading || !file}
                >
                  {isUploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Importing...
                    </>
                  ) : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
