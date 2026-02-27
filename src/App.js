import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, districts: 0, departments: 0 });
  
  const itemsPerPage = 12;

  // Load employee data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await import('./employees.json');
        setEmployees(data.default);
        setSearchResults(data.default);
        
        // Calculate stats
        const districts = new Set(data.default.map(emp => emp.district || 'Unknown'));
        const departments = new Set(data.default.map(emp => emp.department || 'Unknown'));
        setStats({
          total: data.default.length,
          districts: districts.size,
          departments: departments.size
        });
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    loadData();
  }, []);

  // Search function
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setLoading(true);
      const filtered = employees.filter(emp => {
        const term = searchTerm.toLowerCase();
        return (
          (emp.name?.toLowerCase().includes(term)) ||
          (emp.designation?.toLowerCase().includes(term)) ||
          (emp.department?.toLowerCase().includes(term)) ||
          (emp.district?.toLowerCase().includes(term)) ||
          (emp.phone?.includes(term)) ||
          (emp.email?.toLowerCase().includes(term))
        );
      });
      
      // Apply filters
      let results = filtered;
      if (filterDistrict !== 'all') {
        results = results.filter(emp => emp.district === filterDistrict);
      }
      if (filterDepartment !== 'all') {
        results = results.filter(emp => emp.department === filterDepartment);
      }
      
      setSearchResults(results);
      setCurrentPage(1);
      setLoading(false);
    } else {
      setSearchResults(employees);
    }
  }, [searchTerm, filterDistrict, filterDepartment, employees]);

  // Get unique districts and departments
  const districts = ['all', ...new Set(employees.map(emp => emp.district || 'Unknown').filter(Boolean))];
  const departments = ['all', ...new Set(employees.map(emp => emp.department || 'Unknown').filter(Boolean))];

  // Pagination
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);

  // Export to Excel
  const exportToExcel = () => {
    const headers = ['Name', 'Designation', 'Department', 'District', 'Phone', 'Email'];
    const csvData = searchResults.map(emp => [
      emp.name || '',
      emp.designation || '',
      emp.department || '',
      emp.district || '',
      emp.phone || '',
      emp.email || ''
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg sticky-top" style={{background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)'}}>
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">
            <i className="fas fa-building text-primary me-2"></i>
            DoIT&C Rajasthan
          </a>
          <div className="ms-auto d-flex gap-3">
            <span className="badge" style={{background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white', padding: '5px 15px', borderRadius: '50px'}}>
              <i className="fas fa-users me-2"></i>
              {stats.total.toLocaleString()} Employees
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6" data-aos="fade-right">
              <h1 className="display-4 fw-bold text-white mb-4">
                Official Employee Directory
              </h1>
              <p className="text-white-50 mb-4 fs-5">
                Department of Information Technology & Communication, Rajasthan
              </p>
              
              {/* Search Box */}
              <div className="search-box" style={{background: 'white', borderRadius: '50px', padding: '10px 20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}}>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0">
                    <i className="fas fa-search text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 ps-0"
                    placeholder="Search by name, designation, department, district..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-link text-decoration-none"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="col-lg-6" data-aos="fade-left">
              <div className="row g-4">
                <div className="col-sm-4">
                  <div className="stats-card" style={{background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                    <div className="display-4 fw-bold text-primary mb-2">{stats.total.toLocaleString()}</div>
                    <div className="text-secondary">Total Employees</div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="stats-card" style={{background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                    <div className="display-4 fw-bold text-success mb-2">{stats.districts}</div>
                    <div className="text-secondary">Districts</div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="stats-card" style={{background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                    <div className="display-4 fw-bold text-info mb-2">{stats.departments}</div>
                    <div className="text-secondary">Departments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="container" data-aos="fade-up">
        <div className="filter-section" style={{background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)'}}>
          <div className="row g-4">
            <div className="col-md-3">
              <label className="form-label fw-semibold">District</label>
              <select 
                className="form-select"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
              >
                <option value="all">All Districts</option>
                {districts.filter(d => d !== 'all').map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Department</label>
              <select 
                className="form-select"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.filter(d => d !== 'all').map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Items per page</label>
              <select 
                className="form-select"
                value={itemsPerPage}
                onChange={(e) => setCurrentPage(1)}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button 
                className="btn btn-success w-100"
                onClick={exportToExcel}
                disabled={searchResults.length === 0}
              >
                <i className="fas fa-download me-2"></i>
                Export to Excel
              </button>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 d-flex justify-content-between align-items-center">
            <div className="text-secondary">
              {searchTerm && (
                <span className="badge bg-primary me-2">{searchResults.length} results</span>
              )}
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, searchResults.length)} of {searchResults.length}
            </div>
            {searchTerm && (
              <button 
                className="btn btn-link text-decoration-none"
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-redo-alt me-2"></i>
                Clear Search
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Employee Grid */}
      <section className="container py-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-white mt-3">Searching employees...</p>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {paginatedResults.map((emp, index) => (
                <div key={index} className="col-md-6 col-lg-4 col-xl-3" data-aos="fade-up" data-aos-delay={index * 50}>
                  <div 
                    className="employee-card h-100" 
                    style={{background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.08)', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.3s'}}
                    onClick={() => setSelectedEmployee(emp)}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(37,99,235,0.15)'; e.currentTarget.style.borderColor = '#2563eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                        <i className="fas fa-user-circle fa-2x text-primary"></i>
                      </div>
                      <div>
                        <h5 className="fw-bold mb-1">{emp.name || 'N/A'}</h5>
                        <span className="badge bg-light text-dark">{emp.designation || 'Staff'}</span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2 text-secondary">
                        <i className="fas fa-building me-2" style={{ width: 20 }}></i>
                        <small>{emp.department || 'DoIT&C'}</small>
                      </div>
                      <div className="d-flex align-items-center mb-2 text-secondary">
                        <i className="fas fa-map-marker-alt me-2" style={{ width: 20 }}></i>
                        <small>{emp.district || 'Rajasthan'}</small>
                      </div>
                      {emp.phone && (
                        <div className="d-flex align-items-center text-secondary">
                          <i className="fas fa-phone me-2" style={{ width: 20 }}></i>
                          <small>{emp.phone}</small>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <span className="badge bg-primary bg-opacity-10 text-primary">
                        <i className="fas fa-eye me-1"></i> View Details
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-5">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </li>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    return (
                      <li key={i} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{borderRadius: '20px', border: 'none'}}>
              <div className="modal-header" style={{background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white', borderRadius: '20px 20px 0 0', padding: '30px'}}>
                <div>
                  <h4 className="modal-title fw-bold mb-2">{selectedEmployee.name}</h4>
                  <span className="badge bg-white text-primary">{selectedEmployee.designation || 'Staff Member'}</span>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedEmployee(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="detail-card" style={{background: '#f8fafc', borderRadius: '15px', padding: '20px', marginBottom: '15px'}}>
                      <h6 className="fw-bold mb-3">
                        <i className="fas fa-address-card text-primary me-2"></i>
                        Personal Information
                      </h6>
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td className="text-secondary">Name:</td>
                            <td className="fw-semibold">{selectedEmployee.name}</td>
                          </tr>
                          <tr>
                            <td className="text-secondary">Employee ID:</td>
                            <td className="fw-semibold">{selectedEmployee.id || `EMP${Math.floor(Math.random()*10000)}`}</td>
                          </tr>
                          <tr>
                            <td className="text-secondary">Designation:</td>
                            <td className="fw-semibold">{selectedEmployee.designation || 'Staff Member'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="detail-card" style={{background: '#f8fafc', borderRadius: '15px', padding: '20px', marginBottom: '15px'}}>
                      <h6 className="fw-bold mb-3">
                        <i className="fas fa-phone text-primary me-2"></i>
                        Contact Information
                      </h6>
                      <table className="table table-borderless">
                        <tbody>
                          {selectedEmployee.phone && (
                            <tr>
                              <td className="text-secondary">Phone:</td>
                              <td className="fw-semibold">
                                <a href={`tel:${selectedEmployee.phone}`} className="text-decoration-none">
                                  {selectedEmployee.phone}
                                </a>
                              </td>
                            </tr>
                          )}
                          {selectedEmployee.email && (
                            <tr>
                              <td className="text-secondary">Email:</td>
                              <td className="fw-semibold">
                                <a href={`mailto:${selectedEmployee.email}`} className="text-decoration-none">
                                  {selectedEmployee.email}
                                </a>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="detail-card" style={{background: '#f8fafc', borderRadius: '15px', padding: '20px', marginBottom: '15px'}}>
                      <h6 className="fw-bold mb-3">
                        <i className="fas fa-briefcase text-primary me-2"></i>
                        Work Information
                      </h6>
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td className="text-secondary">Department:</td>
                            <td className="fw-semibold">{selectedEmployee.department || 'DoIT&C'}</td>
                          </tr>
                          <tr>
                            <td className="text-secondary">District:</td>
                            <td className="fw-semibold">{selectedEmployee.district || 'Rajasthan'}</td>
                          </tr>
                          <tr>
                            <td className="text-secondary">Location:</td>
                            <td className="fw-semibold">{selectedEmployee.location || selectedEmployee.district || 'Rajasthan'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="detail-card" style={{background: '#f8fafc', borderRadius: '15px', padding: '20px', marginBottom: '15px'}}>
                      <h6 className="fw-bold mb-3">
                        <i className="fas fa-cog text-primary me-2"></i>
                        Quick Actions
                      </h6>
                      <div className="d-grid gap-2">
                        {selectedEmployee.phone && (
                          <a href={`tel:${selectedEmployee.phone}`} className="btn btn-primary">
                            <i className="fas fa-phone me-2"></i>
                            Call Now
                          </a>
                        )}
                        {selectedEmployee.email && (
                          <a href={`mailto:${selectedEmployee.email}`} className="btn btn-success">
                            <i className="fas fa-envelope me-2"></i>
                            Send Email
                          </a>
                        )}
                        <button className="btn btn-outline-primary">
                          <i className="fas fa-print me-2"></i>
                          Print Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{background: 'white', marginTop: '50px', padding: '50px 0 20px'}}>
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <h5 className="fw-bold mb-3">
                <i className="fas fa-building text-primary me-2"></i>
                DoIT&C Rajasthan
              </h5>
              <p className="text-secondary">
                Official employee directory of Department of Information Technology & Communication, Rajasthan.
              </p>
            </div>
            <div className="col-md-2">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Home</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">About Us</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Contact</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Help</a></li>
              </ul>
            </div>
            <div className="col-md-2">
              <h6 className="fw-bold mb-3">Resources</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Privacy Policy</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Terms of Service</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Accessibility</a></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-3">Contact</h6>
              <ul className="list-unstyled">
                <li className="mb-2 text-secondary">
                  <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                  Yojana Bhawan, Jaipur
                </li>
                <li className="mb-2 text-secondary">
                  <i className="fas fa-envelope me-2 text-primary"></i>
                  support@doitc.rajasthan.gov.in
                </li>
                <li className="mb-2 text-secondary">
                  <i className="fas fa-phone me-2 text-primary"></i>
                  0141-2222222
                </li>
              </ul>
            </div>
          </div>
          <hr className="my-4" />
          <div className="text-center text-secondary">
            <small>© 2024 Department of Information Technology & Communication, Rajasthan. All rights reserved.</small>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;