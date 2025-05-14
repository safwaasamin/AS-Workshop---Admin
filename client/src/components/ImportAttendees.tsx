import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";

interface ImportAttendeesProps {
  eventId: number;
}

// Form schema for manual attendee entry
const manualEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
});

type ManualEntryForm = z.infer<typeof manualEntrySchema>;

export function ImportAttendees({ eventId }: ImportAttendeesProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'manual' | 'pdf'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [generateCredentials, setGenerateCredentials] = useState(true);
  const [sendInvitations, setSendInvitations] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [importedAttendees, setImportedAttendees] = useState<any[]>([]);
  const [manualFormData, setManualFormData] = useState<ManualEntryForm>({
    name: '',
    email: '',
    company: '',
    position: '',
    phone: ''
  });
  const [manualFormErrors, setManualFormErrors] = useState<Partial<Record<keyof ManualEntryForm, string>>>({});
  
  const { toast } = useToast();
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
      
      toast({
        title: "Success",
        description: `Successfully imported ${data.length} applicant(s).`,
      });
      
      // Reset form fields
      setFile(null);
      setPdfFile(null);
      setManualFormData({
        name: '',
        email: '',
        company: '',
        position: '',
        phone: ''
      });
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
  
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
      setError("");
    }
  };
  
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setManualFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (manualFormErrors[name as keyof ManualEntryForm]) {
      setManualFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateManualForm = (): boolean => {
    try {
      manualEntrySchema.parse(manualFormData);
      setManualFormErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Partial<Record<keyof ManualEntryForm, string>> = {};
        err.errors.forEach(error => {
          const path = error.path[0] as keyof ManualEntryForm;
          errors[path] = error.message;
        });
        setManualFormErrors(errors);
      }
      return false;
    }
  };
  
  const handleFileSubmit = (e: React.FormEvent) => {
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
    formData.append('importType', 'excel');
    
    importMutation.mutate(formData);
  };
  
  const handlePdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pdfFile) {
      setError("Please select a PDF file to upload");
      return;
    }
    
    // Check file extension
    const extension = pdfFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf') {
      setError("Please upload a PDF file");
      return;
    }
    
    setIsUploading(true);
    setError("");
    setImportedAttendees([]);
    
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('generateCredentials', generateCredentials.toString());
    formData.append('sendInvitations', sendInvitations.toString());
    formData.append('importType', 'pdf');
    
    importMutation.mutate(formData);
  };
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateManualForm()) {
      return;
    }
    
    setIsUploading(true);
    setError("");
    setImportedAttendees([]);
    
    // Convert manual form data to JSON
    const formData = new FormData();
    formData.append('manualData', JSON.stringify([manualFormData]));
    formData.append('generateCredentials', generateCredentials.toString());
    formData.append('sendInvitations', sendInvitations.toString());
    formData.append('importType', 'manual');
    
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
    
    // Reset state after download
    setImportedAttendees([]);
  };
  
  const closeModal = () => {
    // Reset all state
    setFile(null);
    setPdfFile(null);
    setImportedAttendees([]);
    setError("");
    setManualFormData({
      name: '',
      email: '',
      company: '',
      position: '',
      phone: ''
    });
    
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
  };
  
  return (
    <div className="modal fade" id="importAttendeesModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import Workshop Applicants</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {importedAttendees.length > 0 ? (
              <div className="mb-4">
                <div className="alert alert-success">
                  <h5 className="alert-heading mb-2">Import Successful!</h5>
                  <p className="mb-2">Successfully imported {importedAttendees.length} applicant(s).</p>
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
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'file' ? 'active' : ''}`}
                      onClick={() => setActiveTab('file')}
                    >
                      <i className="bi bi-file-excel me-2"></i>
                      Excel Upload
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'pdf' ? 'active' : ''}`}
                      onClick={() => setActiveTab('pdf')}
                    >
                      <i className="bi bi-file-pdf me-2"></i>
                      PDF Upload
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'manual' ? 'active' : ''}`}
                      onClick={() => setActiveTab('manual')}
                    >
                      <i className="bi bi-keyboard me-2"></i>
                      Manual Entry
                    </button>
                  </li>
                </ul>
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Excel Upload Tab */}
                {activeTab === 'file' && (
                  <>
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
                    <form onSubmit={handleFileSubmit}>
                      <div className="mb-3">
                        <label htmlFor="attendeeFile" className="form-label">Select Excel/CSV File</label>
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
                          ) : 'Import Excel'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* PDF Upload Tab */}
                {activeTab === 'pdf' && (
                  <>
                    <div className="mb-4">
                      <p>Upload a PDF file containing attendee information. Our system will extract applicant data from the PDF.</p>
                      <p className="small text-muted">For best results, ensure your PDF has clearly structured data with attendee information.</p>
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        PDF parsing works best with forms, tables, and structured content. Complex layouts may result in partially extracted data.
                      </div>
                    </div>
                    <form onSubmit={handlePdfSubmit}>
                      <div className="mb-3">
                        <label htmlFor="attendeePdf" className="form-label">Select PDF File</label>
                        <input 
                          className="form-control" 
                          type="file" 
                          id="attendeePdf" 
                          accept="application/pdf"
                          onChange={handlePdfFileChange}
                        />
                        {pdfFile && (
                          <div className="mt-2">
                            <span className="text-muted">Selected file: {pdfFile.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="form-check mb-3">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="generateCredentialsPdf"
                          checked={generateCredentials}
                          onChange={() => setGenerateCredentials(!generateCredentials)}
                        />
                        <label className="form-check-label" htmlFor="generateCredentialsPdf">
                          Auto-generate login credentials
                        </label>
                      </div>
                      <div className="form-check mb-3">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="sendInvitationEmailsPdf"
                          checked={sendInvitations}
                          onChange={() => setSendInvitations(!sendInvitations)}
                        />
                        <label className="form-check-label" htmlFor="sendInvitationEmailsPdf">
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
                          disabled={isUploading || !pdfFile}
                        >
                          {isUploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing PDF...
                            </>
                          ) : 'Import PDF'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* Manual Entry Tab */}
                {activeTab === 'manual' && (
                  <>
                    <div className="mb-4">
                      <p>Manually enter attendee information for AspiraSys Workshop System.</p>
                    </div>
                    <form onSubmit={handleManualSubmit}>
                      <div className="mb-3">
                        <label htmlFor="name" className="form-label">Name *</label>
                        <input 
                          type="text" 
                          className={`form-control ${manualFormErrors.name ? 'is-invalid' : ''}`}
                          id="name"
                          name="name"
                          value={manualFormData.name}
                          onChange={handleManualInputChange}
                          placeholder="Full name of attendee"
                          required
                        />
                        {manualFormErrors.name && (
                          <div className="invalid-feedback">{manualFormErrors.name}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address *</label>
                        <input 
                          type="email" 
                          className={`form-control ${manualFormErrors.email ? 'is-invalid' : ''}`}
                          id="email"
                          name="email"
                          value={manualFormData.email}
                          onChange={handleManualInputChange}
                          placeholder="Email address (will be used as login ID)"
                          required
                        />
                        {manualFormErrors.email && (
                          <div className="invalid-feedback">{manualFormErrors.email}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label htmlFor="company" className="form-label">Company/Organization</label>
                        <input 
                          type="text" 
                          className="form-control"
                          id="company"
                          name="company"
                          value={manualFormData.company || ''}
                          onChange={handleManualInputChange}
                          placeholder="Company or organization name"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="position" className="form-label">Position/Role</label>
                        <input 
                          type="text" 
                          className="form-control"
                          id="position"
                          name="position"
                          value={manualFormData.position || ''}
                          onChange={handleManualInputChange}
                          placeholder="Current job title or role"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="phone" className="form-label">Phone Number</label>
                        <input 
                          type="text" 
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={manualFormData.phone || ''}
                          onChange={handleManualInputChange}
                          placeholder="Contact phone number"
                        />
                      </div>
                      
                      <div className="form-check mb-3">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="generateCredentialsManual"
                          checked={generateCredentials}
                          onChange={() => setGenerateCredentials(!generateCredentials)}
                        />
                        <label className="form-check-label" htmlFor="generateCredentialsManual">
                          Auto-generate login credentials
                        </label>
                      </div>
                      <div className="form-check mb-3">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="sendInvitationEmailsManual"
                          checked={sendInvitations}
                          onChange={() => setSendInvitations(!sendInvitations)}
                        />
                        <label className="form-check-label" htmlFor="sendInvitationEmailsManual">
                          Send invitation email to attendee
                        </label>
                      </div>
                      
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Adding...
                            </>
                          ) : 'Add Attendee'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
