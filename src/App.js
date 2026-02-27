import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Phone, Mail, Briefcase, User, Loader, X, 
  ChevronDown, ChevronUp, Filter, Download, RefreshCw,
  MapPin, Building, ChevronLeft, ChevronRight, Eye,
  Star, Award, Clock, Calendar, Share2, Printer,
  Facebook, Twitter, Linkedin, Mail as MailIcon
} from 'lucide-react';
import employeesData from './employees.json';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [recentSearches, setRecentSearches] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [stats, setStats] = useState({
    total: employeesData.length,
    districts: 0,
    departments: 0
  });
  
  const itemsPerPage = 12;

  // Calculate stats
  useEffect(() => {
    const districts = new Set(employeesData.map(emp => emp.district || 'Unknown')).size;
    const departments = new Set(employeesData.map(emp => emp.department || 'Unknown')).size;
    setStats({ total: employeesData.length, districts, departments });
  }, []);

  // Get unique districts and departments
  const districts = useMemo(() => {
    const dists = new Set();
    employeesData.forEach(emp => {
      if (emp.district) dists.add(emp.district);
      else if (emp.location) dists.add(emp.location);
      else dists.add('Unknown');
    });
    return ['all', ...Array.from(dists).sort()];
  }, []);

  const departments = useMemo(() => {
    const depts = new Set();
    employeesData.forEach(emp => {
      if (emp.department) depts.add(emp.department);
      else depts.add('DoIT&C');
    });
    return ['all', ...Array.from(depts).sort()];
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Search function
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setLoading(true);
      setCurrentPage(1);
      
      const timeoutId = setTimeout(() => {
        let filtered = employeesData.filter(emp => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
            (emp.designation && emp.designation.toLowerCase().includes(searchLower)) ||
            (emp.department && emp.department.toLowerCase().includes(searchLower)) ||
            (emp.district && emp.district.toLowerCase().includes(searchLower)) ||
            (emp.location && emp.location.toLowerCase().includes(searchLower)) ||
            (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
            (emp.phone && emp.phone.includes(searchTerm))
          );
        });
        
        // Apply filters
        if (filterDistrict !== 'all') {
          filtered = filtered.filter(emp => 
            emp.district === filterDistrict || emp.location === filterDistrict
          );
        }
        
        if (filterDepartment !== 'all') {
          filtered = filtered.filter(emp => emp.department === filterDepartment);
        }

        if (showFavoritesOnly) {
          filtered = filtered.filter(emp => favorites.includes(emp.id || emp.name));
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          let aVal = a[sortBy] || '';
          let bVal = b[sortBy] || '';
          
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          
          if (sortOrder === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          }
        });
        
        setSearchResults(filtered);

        // Add to recent searches
        if (!recentSearches.includes(searchTerm)) {
          setRecentSearches(prev => [searchTerm, ...prev].slice(0, 5));
        }
        
        setLoading(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, filterDistrict, filterDepartment, sortBy, sortOrder, showFavoritesOnly, favorites]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const toggleFavorite = (emp) => {
    const empId = emp.id || emp.name;
    if (favorites.includes(empId)) {
      setFavorites(favorites.filter(id => id !== empId));
    } else {
      setFavorites([...favorites, empId]);
    }
  };

  const isFavorite = (emp) => {
    return favorites.includes(emp.id || emp.name);
  };

  const highlightText = (text, highlight) => {
    if (!text || !highlight.trim()) return text;
    
    try {
      const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, i) => 
        regex.test(part) ? 
          <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
          part
      );
    } catch (e) {
      return text;
    }
  };

  // Pagination
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(searchResults.length / itemsPerPage);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Designation', 'Department', 'District', 'Phone', 'Email'];
    const csvData = searchResults.map(emp => [
      emp.name || '',
      emp.designation || '',
      emp.department || '',
      emp.district || emp.location || '',
      emp.phone || '',
      emp.email || ''
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with Stats */}
      <header className="bg-white shadow-lg border-b border-indigo-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  DoIT&C Rajasthan
                </h1>
                <p className="text-sm text-gray-600">Employee Directory Portal</p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                <div className="text-xs text-blue-600">Total Employees</div>
                <div className="text-2xl font-bold text-blue-700">{stats.total.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                <div className="text-xs text-green-600">Districts</div>
                <div className="text-2xl font-bold text-green-700">{stats.districts}</div>
              </div>
              <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                <div className="text-xs text-purple-600">Departments</div>
                <div className="text-2xl font-bold text-purple-700">{stats.departments}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, designation, department, district, phone or email..."
                className="w-full pl-12 pr-24 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-lg bg-white/80"
                value={searchTerm}
                onChange={handleSearch}
              />
              <div className="absolute right-2 top-2 flex space-x-2">
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Clear search"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Toggle view"
                >
                  {viewMode === 'grid' ? '📋' : '🔲'}
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  showFavoritesOnly 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-yellow-500' : ''}`} />
                <span>Favorites</span>
              </button>

              <button
                onClick={exportToCSV}
                disabled={searchResults.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <div className="flex-1 text-right text-sm text-gray-600">
                {searchTerm.length >= 2 && (
                  <span className="font-semibold text-indigo-600">
                    {searchResults.length} results found
                  </span>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <select
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {districts.map(dist => (
                        <option key={dist} value={dist}>
                          {dist === 'all' ? 'All Districts' : dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="name">Name</option>
                        <option value="designation">Designation</option>
                        <option value="department">Department</option>
                        <option value="district">District</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {sortOrder === 'asc' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Items per page
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setCurrentPage(1)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && searchTerm.length < 2 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Recent searches:</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchTerm(search)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Searching employees...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="mb-4 flex justify-between items-center">
                <p className="text-gray-600">
                  Showing <span className="font-bold text-indigo-600">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-indigo-600">
                    {Math.min(currentPage * itemsPerPage, searchResults.length)}
                  </span>{' '}
                  of <span className="font-bold text-indigo-600">{searchResults.length}</span> results
                </p>
              </div>

              {/* Grid/List View */}
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {paginatedResults.map((emp, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                      selectedEmployee === emp 
                        ? 'border-indigo-500 ring-2 ring-indigo-200' 
                        : 'border-gray-100 hover:border-indigo-200'
                    }`}
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    {viewMode === 'grid' ? (
                      /* Grid View Card */
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {emp.name ? emp.name.charAt(0) : '?'}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(emp); }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Star className={`w-5 h-5 ${isFavorite(emp) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                          </button>
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-800 mb-1">
                          {highlightText(emp.name || 'N/A', searchTerm)}
                        </h3>
                        <p className="text-indigo-600 text-sm font-medium mb-2">
                          {highlightText(emp.designation || 'Staff Member', searchTerm)}
                        </p>
                        
                        <div className="space-y-2 mt-4 text-sm">
                          {emp.department && (
                            <div className="flex items-center text-gray-600">
                              <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{highlightText(emp.department, searchTerm)}</span>
                            </div>
                          )}
                          {(emp.district || emp.location) && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{highlightText(emp.district || emp.location, searchTerm)}</span>
                            </div>
                          )}
                          {emp.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{highlightText(emp.phone, searchTerm)}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-500">Click to view details</span>
                          <Eye className="w-4 h-4 text-indigo-600" />
                        </div>
                      </div>
                    ) : (
                      /* List View Card */
                      <div className="p-4 flex items-center hover:bg-gray-50">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold mr-4">
                          {emp.name ? emp.name.charAt(0) : '?'}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <div className="font-semibold">{highlightText(emp.name || 'N/A', searchTerm)}</div>
                            <div className="text-sm text-indigo-600">{highlightText(emp.designation || '', searchTerm)}</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {highlightText(emp.department || '', searchTerm)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {highlightText(emp.district || emp.location || '', searchTerm)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {emp.phone || ''}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(emp); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition ml-2"
                        >
                          <Star className={`w-5 h-5 ${isFavorite(emp) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg transition ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">No Results Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                We couldn't find any employees matching "{searchTerm}". Try different keywords or filters.
              </p>
              <button
                onClick={clearSearch}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Clear Search</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-16 h-16 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Employee Directory</h3>
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
                Search for any employee by name, designation, department, district, or contact information.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="text-3xl mb-2">🔍</div>
                  <h4 className="font-semibold mb-2">Smart Search</h4>
                  <p className="text-sm text-gray-600">Search across all fields with intelligent matching</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <div className="text-3xl mb-2">📍</div>
                  <h4 className="font-semibold mb-2">District Wise</h4>
                  <p className="text-sm text-gray-600">Filter employees by district and location</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl">
                  <div className="text-3xl mb-2">⭐</div>
                  <h4 className="font-semibold mb-2">Favorites</h4>
                  <p className="text-sm text-gray-600">Save frequently accessed employees</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Employee Details Modal/Sidebar */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEmployee(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl font-bold backdrop-blur-sm">
                    {selectedEmployee.name ? selectedEmployee.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{selectedEmployee.name}</h2>
                    <p className="text-indigo-100 text-lg mt-1">{selectedEmployee.designation || 'Staff Member'}</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - Contact Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center">
                        <Phone className="w-5 h-5 mr-2 text-indigo-600" />
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        {selectedEmployee.phone && (
                          <div className="flex items-center p-3 bg-white rounded-lg">
                            <Phone className="w-5 h-5 text-indigo-600 mr-3" />
                            <div>
                              <div className="text-sm text-gray-500">Phone</div>
                              <a href={`tel:${selectedEmployee.phone}`} className="font-medium text-gray-800 hover:text-indigo-600">
                                {selectedEmployee.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {selectedEmployee.email && (
                          <div className="flex items-center p-3 bg-white rounded-lg">
                            <Mail className="w-5 h-5 text-indigo-600 mr-3" />
                            <div>
                              <div className="text-sm text-gray-500">Email</div>
                              <a href={`mailto:${selectedEmployee.email}`} className="font-medium text-gray-800 hover:text-indigo-600 break-all">
                                {selectedEmployee.email}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center">
                        <Share2 className="w-5 h-5 mr-2 text-indigo-600" />
                        Share Profile
                      </h3>
                      <div className="flex space-x-3">
                        <button className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                          <Facebook className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition">
                          <Twitter className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 transition">
                          <Linkedin className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                          <MailIcon className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Professional Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                        Professional Details
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center p-3 bg-white rounded-lg">
                          <Building className="w-5 h-5 text-indigo-600 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Department</div>
                            <div className="font-medium text-gray-800">{selectedEmployee.department || 'DoIT&C Rajasthan'}</div>
                          </div>
                        </div>
                        {(selectedEmployee.district || selectedEmployee.location) && (
                          <div className="flex items-center p-3 bg-white rounded-lg">
                            <MapPin className="w-5 h-5 text-indigo-600 mr-3" />
                            <div>
                              <div className="text-sm text-gray-500">District / Location</div>
                              <div className="font-medium text-gray-800">{selectedEmployee.district || selectedEmployee.location}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center p-3 bg-white rounded-lg">
                          <Award className="w-5 h-5 text-indigo-600 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Designation</div>
                            <div className="font-medium text-gray-800">{selectedEmployee.designation || 'Staff Member'}</div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 bg-white rounded-lg">
                          <Clock className="w-5 h-5 text-indigo-600 mr-3" />
                          <div>
                            <div className="text-sm text-gray-500">Employee ID</div>
                            <div className="font-medium text-gray-800">{selectedEmployee.id || `EMP${Math.floor(Math.random() * 10000)}`}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedEmployee.phone && (
                        <a
                          href={`tel:${selectedEmployee.phone}`}
                          className="flex items-center justify-center space-x-2 p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition transform hover:scale-105"
                        >
                          <Phone className="w-5 h-5" />
                          <span>Call Now</span>
                        </a>
                      )}
                      {selectedEmployee.email && (
                        <a
                          href={`mailto:${selectedEmployee.email}`}
                          className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition transform hover:scale-105"
                        >
                          <Mail className="w-5 h-5" />
                          <span>Send Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="w-6 h-6 text-indigo-600" />
                <span className="font-bold text-lg">DoIT&C Rajasthan</span>
              </div>
              <p className="text-sm text-gray-600">
                Official employee directory of Department of Information Technology & Communication, Rajasthan.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-indigo-600">Home</a></li>
                <li><a href="#" className="hover:text-indigo-600">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-600">Help</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-indigo-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-600">Accessibility</a></li>
                <li><a href="#" className="hover:text-indigo-600">Sitemap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Yojana Bhawan, Jaipur</li>
                <li>support@doitc.rajasthan.gov.in</li>
                <li>0141-2222222</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2024 Department of Information Technology & Communication, Rajasthan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;