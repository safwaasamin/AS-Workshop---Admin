import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

interface ReportsGenerationProps {
  eventId: number;
}

export function ReportsGeneration({ eventId }: ReportsGenerationProps) {
  const [reportType, setReportType] = useState<"all" | "completed" | "in_progress">("all");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("xlsx");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/reports`],
    enabled: !!eventId,
  });
  
  if (isLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading report data. Please try again.
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="alert alert-info">
        No attendee data available for generating reports.
      </div>
    );
  }
  
  const generateReport = () => {
    setIsGenerating(true);
    
    // Filter data based on selected report type
    let reportData = [...data];
    if (reportType === "completed") {
      reportData = reportData.filter(item => item.status === "completed");
    } else if (reportType === "in_progress") {
      reportData = reportData.filter(item => item.status === "in_progress");
    }
    
    // Format data for report
    const formattedData = reportData.map(item => ({
      Name: item.name,
      Email: item.email,
      Company: item.company || "N/A",
      Status: item.status,
      "Registration Date": new Date(item.registrationDate).toLocaleDateString(),
      Mentor: item.mentor,
      Score: item.score || "N/A",
      "Completion Time": item.completionTime || "N/A"
    }));
    
    // Generate file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `event-report-${reportType}-${timestamp}`;
    
    // Create and download file
    if (exportFormat === "csv") {
      // Generate CSV
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `${fileName}.csv`);
    } else {
      // Generate XLSX
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `${fileName}.xlsx`);
    }
    
    setIsGenerating(false);
  };
  
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0">Generate Reports</h5>
      </div>
      <div className="card-body">
        <div className="row mb-4">
          <div className="col-md-6">
            <h6 className="mb-3">1. Select Report Type</h6>
            <div className="list-group">
              <label className="list-group-item d-flex gap-2">
                <input 
                  className="form-check-input flex-shrink-0" 
                  type="radio" 
                  name="reportType" 
                  checked={reportType === "all"} 
                  onChange={() => setReportType("all")}
                />
                <span>
                  <strong>All Attendees</strong>
                  <small className="d-block text-muted">Complete list of all registered attendees</small>
                </span>
              </label>
              <label className="list-group-item d-flex gap-2">
                <input 
                  className="form-check-input flex-shrink-0" 
                  type="radio" 
                  name="reportType" 
                  checked={reportType === "completed"} 
                  onChange={() => setReportType("completed")}
                />
                <span>
                  <strong>Completed Attendees</strong>
                  <small className="d-block text-muted">Only attendees who completed all tasks</small>
                </span>
              </label>
              <label className="list-group-item d-flex gap-2">
                <input 
                  className="form-check-input flex-shrink-0" 
                  type="radio" 
                  name="reportType" 
                  checked={reportType === "in_progress"} 
                  onChange={() => setReportType("in_progress")}
                />
                <span>
                  <strong>In Progress Attendees</strong>
                  <small className="d-block text-muted">Attendees currently working on tasks</small>
                </span>
              </label>
            </div>
          </div>
          
          <div className="col-md-6">
            <h6 className="mb-3">2. Select Export Format</h6>
            <div className="list-group">
              <label className="list-group-item d-flex gap-2">
                <input 
                  className="form-check-input flex-shrink-0" 
                  type="radio" 
                  name="exportFormat" 
                  checked={exportFormat === "xlsx"} 
                  onChange={() => setExportFormat("xlsx")}
                />
                <span>
                  <strong>Excel Format (.xlsx)</strong>
                  <small className="d-block text-muted">Microsoft Excel compatible format</small>
                </span>
              </label>
              <label className="list-group-item d-flex gap-2">
                <input 
                  className="form-check-input flex-shrink-0" 
                  type="radio" 
                  name="exportFormat" 
                  checked={exportFormat === "csv"} 
                  onChange={() => setExportFormat("csv")}
                />
                <span>
                  <strong>CSV Format (.csv)</strong>
                  <small className="d-block text-muted">Comma-separated values, works with most programs</small>
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h6 className="mb-0">Report Preview</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Mentor</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>
                        <span className={`badge bg-${
                          item.status === 'completed' ? 'success' : 
                          item.status === 'in_progress' ? 'warning' : 
                          'secondary'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td>{new Date(item.registrationDate).toLocaleDateString()}</td>
                      <td>{item.mentor}</td>
                      <td>{item.score || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 5 && (
              <div className="text-center py-2 text-muted">
                <small>Showing 5 of {data.length} records...</small>
              </div>
            )}
          </div>
        </div>
        
        <div className="d-grid">
          <button 
            className="btn btn-primary" 
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating Report...
              </>
            ) : (
              <>
                <i className="bi bi-download me-2"></i>
                Generate and Download Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
