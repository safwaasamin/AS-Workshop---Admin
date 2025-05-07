import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ImportAttendeesProps {
  eventId: number;
}

export function ImportAttendees({ eventId }: ImportAttendeesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [generateCredentials, setGenerateCredentials] = useState(true);
  const [sendInvitations, setSendInvitations] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [importedAttendees, setImportedAttendees] = useState<any[]>([]);
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/stats`] });
      
      // Save imported attendees for credentials download
      setImportedAttendees(data);
      
      // If credentials were generated, show a success message with download button
      if (generateCredentials && data.length > 0) {
        setError("");
        // Don't close modal yet, show download option
      } else {
        // Reset form and close modal if no credentials to download
        setFile(null);
        setError("");
        
        // Close modal using DOM API
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
    setImportedAttendees([]);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('generateCredentials', generateCredentials.toString());
    formData.append('sendInvitations', sendInvitations.toString());
    
    importMutation.mutate(formData);
  };
  
  const handleDownloadCredentials = () => {
    if (!importedAttendees.length) return;
    
    // Create a worksheet with login credentials
    const ws = XLSX.utils.json_to_sheet(
      importedAttendees.map(attendee => ({
        Name: attendee.name,
        Email: attendee.email,
        Username: attendee.username,
        Password: attendee.password
      }))
    );
    
    // Create a workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credentials");
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save the file
    saveAs(data, `AspiraSys_Workshop_System_Credentials_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Close modal
    const modal = document.getElementById('importAttendeesModal');
    if (modal) {
      const bsModal = window.bootstrap?.Modal.getInstance(modal);
      if (bsModal) {
        bsModal.hide();
      } else {
        const closeButton = modal.querySelector('.btn-close');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      }
    }
    
    // Reset state
    setFile(null);
    setImportedAttendees([]);
  };
  
  return (
    <div className="modal fade" id="importAttendeesModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import Workshop Applicants</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="mb-4">
              <p>Upload a CSV or Excel file with applicant data for AspiraSys Workshop System. The file should include the following columns:</p>
              <ul className="small text-muted">
                <li><strong>Name</strong> (required) - Full name of the applicant</li>
                <li><strong>Email</strong> (required) - Will be used as login ID</li>
                <li><strong>Company</strong> (optional) - Organization or institution</li>
                <li><strong>Position</strong> (optional) - Current role or job title</li>
                <li><strong>Phone</strong> (optional) - Contact number</li>
              </ul>
              <div className="bg-light p-2 rounded border mt-2">
                <p className="mb-1 small fw-bold">Sample Excel format:</p>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered small mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Company</th>
                        <th>Position</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Doe</td>
                        <td>john.doe@example.com</td>
                        <td>Tech Company</td>
                        <td>Developer</td>
                        <td>1234567890</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {importedAttendees.length > 0 ? (
              <div className="mb-4">
                <div className="alert alert-success">
                  <h5 className="alert-heading mb-2">Import Successful!</h5>
                  <p className="mb-2">Successfully imported {importedAttendees.length} applicants.</p>
                  {generateCredentials && (
                    <p className="mb-0">Login credentials have been generated. Please download them for your records.</p>
                  )}
                </div>
                
                <div className="d-grid gap-2 mt-3">
                  <button 
                    className="btn btn-primary"
                    onClick={handleDownloadCredentials}
                  >
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    Download Credentials (Excel)
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setImportedAttendees([]);
                      setFile(null);
                      
                      // Close modal
                      const modal = document.getElementById('importAttendeesModal');
                      if (modal) {
                        const bsModal = window.bootstrap?.Modal.getInstance(modal);
                        if (bsModal) {
                          bsModal.hide();
                        } else {
                          const closeButton = modal.querySelector('.btn-close');
                          if (closeButton) {
                            (closeButton as HTMLElement).click();
                          }
                        }
                      }
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
