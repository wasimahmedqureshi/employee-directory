import React, { useState, useEffect, useMemo } from 'react';
import { Search, Phone, Mail, Briefcase, User, Loader, X, ChevronDown, ChevronUp, Filter, Download, RefreshCw } from 'lucide-react';
import Fuse from 'fuse.js';
import employeesData from './employees.json';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set();
    employeesData.forEach(emp => {
      if (emp.department) depts.add(emp.department);
    });
    return ['all', ...Array.from(depts)];
  }, []);

  // Fuse.js configuration for fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'designation', weight: 0.5 },
      { name: 'department', weight: 0.4 },
      { name: 'email', weight: 0.3 },
      { name: 'phone', weight: 0.2 }
    ],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2
  };

  const fuse = useMemo(() => new Fuse(employeesData, fuseOptions), []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      setLoading(true);
      setCurrentPage(1);
      
      // Add to recent searches
      if (!recentSearches.includes(searchTerm)) {
        setRecentSearches(prev => [searchTerm, ...prev].slice(0, 5));
      }
      
      // Simulate API delay
      const timeoutId = setTimeout(() => {
        const results = fuse.search(searchTerm);
        let filteredResults = results.map(r => r.item);
        
        // Apply department filter
        if (filterDepartment !== 'all') {
          filteredResults = filteredResults.filter(emp => emp.department === filterDepartment);
        }
        
        // Apply sorting
        filteredResults.sort((a, b) => {
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
        
        setSearchResults(filteredResults);
        setLoading(false);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, filterDepartment, sortBy, sortOrder, fuse]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const highlightText = (text, highlight) => {
    if (!text || !highlight.trim()) return text;
    
    try {
      const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, i) => 
        regex.test(part) ? 
          <span key={i} className="bg-yellow-200 font-semibold px-1 rounded">{part}</span> : 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-indigo-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  DoIT&C Rajasthan
                </h1>
                <p className="text-xs md:text-sm text-gray-600">Employee Directory</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm md:text-base font-semibold text-indigo-600">
                {employeesData.length}+ Employees
              </div>
              <div className="text-xs text-gray-500">Updated Daily</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="🔍 Search by name, designation, department, email or phone..."
                className="search-input w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-base md:text-lg bg-white/80"
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mt-4 flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Advanced Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="name">Name</option>
                        <option value="designation">Designation</option>
                        <option value="department">Department</option>
                      </select>
                      <button
                        onClick={() => toggleSort(sortBy)}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {sortOrder === 'asc' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(searchResults, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const exportFileDefaultName = 'search_results.json';
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
                      disabled={searchResults.length === 0}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Results</span>
                    </button>
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

            {/* Search Stats */}
            {searchTerm.length >= 2 && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  Found <span className="font-bold text-indigo-600">{searchResults.length}</span> matching records
                  {loading && <Loader className="inline ml-2 w-4 h-4 text-indigo-500 animate-spin" />}
                </div>
                {searchResults.length > 0 && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Clear results
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Results List */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-white/20 h-[calc(100vh-300px)] lg:h-[calc(100vh-250px)] sticky top-24">
              <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold flex justify-between items-center">
                <span>Search Results</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {searchResults.length}
                </span>
              </div>
              
              <div className="h-full overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Searching...</p>
                  </div>
                ) : paginatedResults.length > 0 ? (
                  <>
                    {paginatedResults.map((emp, index) => (
                      <div
                        key={index}
                        className={`p-4 border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-all hover-card ${
                          selectedEmployee === emp ? 'bg-indigo-100 border-l-4 border-l-indigo-600' : ''
                        }`}
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        <div className="font-semibold text-gray-800 text-lg">
                          {highlightText(emp.name || 'N/A', searchTerm)}
                        </div>
                        <div className="text-sm text-indigo-600 mt-1 font-medium">
                          {highlightText(emp.designation || 'Designation not available', searchTerm)}
                        </div>
                        {emp.department && (
                          <div className="text-xs text-gray-500 mt-2">
                            Dept: {highlightText(emp.department, searchTerm)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2 flex items-center">
                          <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{emp.phone || 'Phone not available'}</span>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="p-4 flex justify-center space-x-2 border-t">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200 transition"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : searchTerm.length >= 2 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h3>
                    <p className="text-gray-500 mb-4">Try different keywords or filters</p>
                    <button
                      onClick={clearSearch}
                      className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Clear search</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Start Searching</h3>
                    <p className="text-gray-500">Type at least 2 characters to search</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employee Details */}
          <div className="lg:col-span-2">
            {selectedEmployee ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-white/20">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                        {selectedEmployee.name}
                      </h2>
                      <p className="text-indigo-600 font-medium text-lg">
                        {selectedEmployee.designation || 'Designation not available'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Badge */}
                  <div className="mt-4 md:mt-0 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                    Active Employee
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4 flex items-center">
                        <Phone className="w-5 h-5 mr-2 text-indigo-600" />
                        Contact Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Phone className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-500">Phone Number</div>
                            <div className="font-medium text-lg">
                              {selectedEmployee.phone ? (
                                <a href={`tel:${selectedEmployee.phone}`} className="text-indigo-600 hover:underline">
                                  {selectedEmployee.phone}
                                </a>
                              ) : 'Not available'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Mail className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-gray-500">Email Address</div>
                            <div className="font-medium">
                              {selectedEmployee.email ? (
                                <a href={`mailto:${selectedEmployee.email}`} className="text-indigo-600 hover:underline break-all">
                                  {selectedEmployee.email}
                                </a>
                              ) : 'Not available'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                        Professional Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-gray-500">Department</div>
                          <div className="font-medium text-lg">
                            {selectedEmployee.department || 'DoIT&C Rajasthan'}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500">Designation</div>
                          <div className="font-medium text-lg">
                            {selectedEmployee.designation || 'Not specified'}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500">Employee ID</div>
                          <div className="font-medium text-lg">
                            {selectedEmployee.id || 'EMP' + Math.floor(Math.random() * 10000)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEmployee.phone && (
                    <a
                      href={`tel:${selectedEmployee.phone}`}
                      className="group bg-indigo-600 text-white py-4 px-6 rounded-xl text-center hover:bg-indigo-700 transition flex items-center justify-center space-x-3 transform hover:scale-105"
                    >
                      <Phone className="w-5 h-5 group-hover:animate-pulse" />
                      <span className="font-semibold">Call Now</span>
                    </a>
                  )}
                  {selectedEmployee.email && (
                    <a
                      href={`mailto:${selectedEmployee.email}`}
                      className="group bg-green-600 text-white py-4 px-6 rounded-xl text-center hover:bg-green-700 transition flex items-center justify-center space-x-3 transform hover:scale-105"
                    >
                      <Mail className="w-5 h-5 group-hover:animate-pulse" />
                      <span className="font-semibold">Send Email</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-12 text-center border border-white/20 h-[calc(100vh-250px)] flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Select an Employee
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Click on any employee from the search results to view their complete profile and contact information
                </p>
                <div className="mt-8 text-indigo-600">
                  <Briefcase className="w-8 h-8 mx-auto opacity-50" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-white/30 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>© 2024 DoIT&C Rajasthan. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-indigo-600 transition">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 transition">Terms of Service</a>
              <a href="#" className="hover:text-indigo-600 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
