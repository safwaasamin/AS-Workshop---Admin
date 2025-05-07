import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";

interface AttendeeTableProps {
  eventId: number;
}

export function AttendeeTable({ eventId }: AttendeeTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/events/${eventId}/attendees`],
    enabled: !!eventId,
  });
  
  if (isLoading) return <Loading />;
  
  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading attendees. Please try again.
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Attendee List</h5>
        </div>
        <div className="card-body">
          <p className="text-muted">No attendees found. Import attendees to get started.</p>
        </div>
      </div>
    );
  }
  
  // Filter and sort data
  let filteredData = [...data];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(
      attendee => 
        attendee.name.toLowerCase().includes(searchLower) ||
        attendee.email.toLowerCase().includes(searchLower) ||
        (attendee.company && attendee.company.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply status filter
  if (statusFilter !== "all") {
    filteredData = filteredData.filter(attendee => attendee.status === statusFilter);
  }
  
  // Apply sorting
  if (sortBy === "name_asc") {
    filteredData.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "name_desc") {
    filteredData.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === "registration_date") {
    filteredData.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
  } else if (sortBy === "status") {
    filteredData.sort((a, b) => a.status.localeCompare(b.status));
  }
  
  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // Status badge color mapping
  const statusColors = {
    registered: "secondary",
    started: "warning",
    in_progress: "warning",
    completed: "success",
    not_started: "danger"
  };
  
  return (
    <>
      {/* Search and filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search attendees..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Filter by Status</option>
                <option value="registered">Registered</option>
                <option value="started">Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="registration_date">Registration Date</option>
                <option value="status">Completion Status</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSortBy("name_asc");
                }}
              >
                <i className="bi bi-funnel me-2"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendees Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Attendee List</h5>
          <span className="text-muted">Showing {paginatedData.length} of {filteredData.length} attendees</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="selectAllAttendees" />
                      <label className="form-check-label" htmlFor="selectAllAttendees"></label>
                    </div>
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                  <th scope="col">Registration Date</th>
                  <th scope="col">Assigned Mentor</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(attendee => (
                  <tr key={attendee.id}>
                    <td>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label"></label>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2" style={{ width: "40px", height: "40px" }}>
                          <span className="text-secondary">{attendee.initials}</span>
                        </div>
                        <div>
                          <div className="fw-semibold">{attendee.name}</div>
                          <div className="small text-muted">{attendee.company}</div>
                        </div>
                      </div>
                    </td>
                    <td>{attendee.email}</td>
                    <td>
                      <span className={`badge bg-${statusColors[attendee.status] || 'secondary'} status-badge`}>
                        {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(attendee.registrationDate).toLocaleDateString()}</td>
                    <td>{attendee.mentorId ? 'Assigned' : 'Not Assigned'}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                          Actions
                        </button>
                        <ul className="dropdown-menu">
                          <li><a className="dropdown-item" href="#"><i className="bi bi-pencil me-2"></i>Edit</a></li>
                          <li><a className="dropdown-item" href="#"><i className="bi bi-person-check me-2"></i>Assign Mentor</a></li>
                          <li><a className="dropdown-item" href="#"><i className="bi bi-envelope me-2"></i>Send Email</a></li>
                          <li><hr className="dropdown-divider" /></li>
                          <li><a className="dropdown-item text-danger" href="#"><i className="bi bi-trash me-2"></i>Delete</a></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white d-flex justify-content-between align-items-center">
          <div>
            <select 
              className="form-select form-select-sm" 
              style={{ width: "80px" }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <a 
                  className="page-link" 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                >
                  Previous
                </a>
              </li>
              {[...Array(totalPages).keys()].map(i => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <a 
                    className="page-link" 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </a>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <a 
                  className="page-link" 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                >
                  Next
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
