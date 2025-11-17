
import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { FiFilter } from "react-icons/fi";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { FaRegFlag } from "react-icons/fa6";
import { LuListTodo } from "react-icons/lu";
import { IoIosAddCircle } from "react-icons/io";
import { PiClockClockwiseFill } from "react-icons/pi";
import { MdArrowDropDown } from "react-icons/md";
import { AirVent, SunDim, MonitorCog, Waves, Wrench, Hammer, Cable, Volume2, Bug, Phone, Cog, BatteryCharging, Wind, Unplug, Tag, Search } from "lucide-react";
import { FaFaucet, FaRegClock } from "react-icons/fa";
import { GiMechanicGarage } from "react-icons/gi";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import JobHome from "../JobHome/JobHome";
import LoadingItems from "../../components/Loading/LoadingItems";
import '../../components/SummaryDashboard/JobStatusPieChart';
import { useAuth } from "../../pages/hooks/useAuth";

const DynamicIcons = {
  FaFaucet: FaFaucet,
  Unplug: Unplug,
  GiMechanicGarage: GiMechanicGarage,
  BatteryCharging: BatteryCharging,
  AirVent: AirVent,
  SunDim: SunDim,
  MonitorCog: MonitorCog,
  Wind: Wind,
  Cable: Cable,
  Bug: Bug,
  Cog: Cog,
  Phone: Phone,
  Volume2: Volume2,
  Wrench: Wrench,
  Waves: Waves,
  Hammer: Hammer,
  Tag: Tag,
};

const StatusIcons = {
  Pending: PiClockClockwiseFill,
  Todo: LuListTodo,
  "In Process": FaRegClock,
  Ended: FaRegFlag,
  Completed: FaCheckCircle,
  Cancelled: FaTimesCircle,
};

const StatusIconColors = {
  Pending: "text-blue-500",
  Todo: "text-purple-500",
  "In Process": "text-orange-400",
  Ended: "text-yellow-400",
  Completed: "text-green-400",
  Cancelled: "text-red-400",
};

const Home = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  };
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const [selectedJob, setSelectedJob] = useState(() => {
    const saved = localStorage.getItem('selectedJob');
    return saved ? JSON.parse(saved) : null;
  });

  // New state to track job badges for "new" state
  const [jobStates, setJobStates] = useState({});

  useEffect(() => {
    const updateJobState = async () => {
      if (selectedJob) {
        localStorage.setItem('selectedJob', JSON.stringify(selectedJob));
        // When a job is opened, update backend first, then local state
        if (jobStates[selectedJob.id] === 'new') {
          try {
            const authToken = localStorage.getItem('authToken');
            const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
            await axios.put(`http://127.0.0.1:8000/api/jobhome-technicians/${selectedJob.id}/state`, { state: 'opened' }, { headers });
            setJobStates(prev => ({ ...prev, [selectedJob.id]: 'opened' }));
          } catch (err) {
            console.error('Failed to update job state:', err);
          }
        }
      } else {
        localStorage.removeItem('selectedJob');
      }
    };
    updateJobState();
  }, [selectedJob]);

  // Helper to check if job has "new" badge
  const isJobNew = (jobId) => jobStates[jobId] === 'new';
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const { userRole } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Function to normalize job status from backend to match frontend filter values
  const normalizeStatus = (backendStatus) => {
    const statusMap = {
      'Pending': 'Pending',
      'pending': 'Pending',
      'todo': 'Todo',
      'inprocess': 'In Process',
      'end': 'Ended',
      'cancel': 'Cancelled',
      'Cancel': 'Cancelled', // Handle both cases
      'complete': 'Completed',
      'Complete': 'Completed',
      'COMPLETED': 'Completed',
      'final': 'Completed',
      'Final': 'Completed'   // Handle both cases
    };
    return statusMap[backendStatus] || backendStatus;
  };

  const fetchJobs = async () => {
    try {
      // Fetch jobs filtered by logged-in technician if applicable
      const authToken = localStorage.getItem('authToken');
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const response = await axios.get("http://127.0.0.1:8000/api/job-homes", { headers });
      const formattedJobs = response.data.map(job => ({
        id: job.id,
        title: job.job_type || "Untitled Job",
        jobNo: job.job_no || "N/A",
        customerName: job.job_card?.customer_name || "Unknown Customer",
        area: job.job_card?.area || "Unknown Area",
        branch: job.job_card?.branch_sc || "Unknown Branch",
        date: formatDateTime(job.created_at),
        createdAt: job.created_at, // Keep original timestamp for sorting
        status: job.job_status ? normalizeStatus(job.job_status.trim()) : "",
        service: job.job_type,
        cancellationReason: job.cancellation?.reason || null,
        cancellationDateTime: job.cancellation?.created_at || null,
        completedDateTime: job.updated_at || null, // Use updated_at as completion date
        payments: job.payments || [],
        invoiceTotal: job.quotation?.invoice?.total_amount || 0,
      }));
      setJobs(formattedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetch job states from backend on jobs load
  useEffect(() => {
    const fetchJobStates = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const response = await axios.get("http://127.0.0.1:8000/api/jobhome-technicians/states", { headers });
        // response expected to be { jobhome_id: state, ... }
        setJobStates(response.data);
      } catch (error) {
        console.error("Error fetching job states:", error);
      }
    };
    fetchJobStates();
  }, [jobs]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/items");
        setItems(response.data);
      } catch (err) {
        console.error("Error fetching items:", err);
        setItemsError("Failed to load services. Please refresh the page.");
      } finally {
        setItemsLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.create-job-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const countJobsByService = jobs.reduce((acc, job) => {
    acc[job.service] = (acc[job.service] || 0) + 1;
    return acc;
  }, {});

  const countJobsBystatus = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  const services = items.map(item => {
    const IconComponent = DynamicIcons[item.icon] || Tag;
    return {
      id: item.id,
      icon: <IconComponent className="text-2xl" />,
      name: item.name,
      jobs: countJobsByService[item.name] || 0
    };
  });

  const statuses = [
    { icon: <PiClockClockwiseFill />, text: "Pending", status: "Pending", jobs: countJobsBystatus["Pending"] || 0 },
    { icon: <LuListTodo />, text: "Todo", status: "Todo", jobs: countJobsBystatus["Todo"] || 0 },
    { icon: <FaRegClock />, text: "In Process", status: "In Process", jobs: countJobsBystatus["In Process"] || 0 },
    { icon: <FaRegFlag />, text: "Ended", status: "Ended", jobs: countJobsBystatus["Ended"] || 0 },
    { icon: <FaCheckCircle />, text: "Completed", status: "Completed", jobs: countJobsBystatus["Completed"] || 0 },
    { icon: <FaTimesCircle />, text: "Cancelled", status: "Cancelled", jobs: countJobsBystatus["Cancelled"] || 0 }
  ];

  const [selectedService, setSelectedService] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];

    const filtered = jobs.filter(job => {
      const matchesService = selectedService ? job.service === selectedService : true;
      const matchesStatus = selectedStatus ? job.status === selectedStatus : true;
      const matchesSearch = searchTerm ?
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobNo.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesService && matchesStatus && matchesSearch;
    }).sort((a, b) => {
      if (!searchTerm) {
        // Sort by created date descending (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      const searchLower = searchTerm.toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aCustomer = a.customerName.toLowerCase();
      const bCustomer = b.customerName.toLowerCase();

      // Calculate relevance scores
      let aScore = 0;
      let bScore = 0;

      // Exact matches get highest priority
      if (aTitle === searchLower) aScore += 100;
      if (bTitle === searchLower) bScore += 100;
      if (aCustomer === searchLower) aScore += 90;
      if (bCustomer === searchLower) bScore += 90;

      // Starts with search term gets high priority
      if (aTitle.startsWith(searchLower)) aScore += 80;
      if (bTitle.startsWith(searchLower)) bScore += 80;
      if (aCustomer.startsWith(searchLower)) aScore += 70;
      if (bCustomer.startsWith(searchLower)) bScore += 70;

      // Contains search term gets medium priority
      if (aTitle.includes(searchLower)) aScore += 60;
      if (bTitle.includes(searchLower)) bScore += 60;
      if (aCustomer.includes(searchLower)) aScore += 50;
      if (bCustomer.includes(searchLower)) bScore += 50;

      // Area and branch matches get lower priority
      if (a.area.toLowerCase().includes(searchLower)) aScore += 40;
      if (b.area.toLowerCase().includes(searchLower)) bScore += 40;
      if (a.branch.toLowerCase().includes(searchLower)) aScore += 30;
      if (b.branch.toLowerCase().includes(searchLower)) bScore += 30;

      return bScore - aScore; // Sort by highest score first
    });

    return filtered;
  }, [jobs, selectedService, selectedStatus, searchTerm]);

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const displayedJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPageButtons = () => {
    const buttons = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 3);

    if (endPage - startPage < 3) {
      startPage = Math.max(1, endPage - 3);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`
            px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base
            ${currentPage === i
              ? 'border-blue-500 bg-blue-500 text-white'
              : `hover:border-blue-500 ${isDarkMode ? 'hover:bg-gray-800 bg-gray-900 text-gray-300' : 'hover:bg-gray-200 bg-white text-gray-800'}`
            }
          `}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  const clearFilters = () => {
    setSelectedStatus(null);
    setSelectedService(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleJobClick = (job) => {
    // Ensure the job object has the correct job_home_id property for JobHome component
    setSelectedJob({ ...job, job_home_id: job.id });
  };

  // Remove the axios.post call from here to delay job creation until the user presses the create button in the UI
  const handleCreateJobCardClick = (serviceName = null) => {
    if (selectedJob && selectedJob.service === serviceName) {
      console.log('A job is already selected. Please deselect it to create a new job.');
      return;
    }
    setSelectedJob({ service: serviceName });
    setIsDropdownOpen(false);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(prev => !prev);
  };

  if (selectedJob) {
    return <JobHome job={selectedJob} onGoBack={() => {
      setSelectedJob(null);
      fetchJobs();
    }} />;
  }

  if (itemsLoading) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} p-6 min-h-screen flex justify-center items-center`}>
        <LoadingItems isDarkMode={isDarkMode} />
      </div>
    );
  }

  if (itemsError) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 min-h-screen flex justify-center items-center`}>
        <div className="bg-red-600 text-white p-4 rounded-lg flex items-center space-x-2">
          <span>{itemsError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} space-y-6 p-4 md:p-8 min-h-screen`}>
      <div className={`${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} rounded-xl p-4 md:p-6 shadow-xl mx-auto`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold">Job Management</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg`}>
              Filter and manage your service jobs efficiently.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-md
                  ${isDarkMode
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
              />
            </div>
            {(userRole === 'Administrator' || userRole === 'Tecnical_Head' || userRole === 'Manager') && (
              <div className="relative inline-block text-left create-job-dropdown-container w-full sm:w-auto">
                <button
                  type="button"
                  className={`
                    w-full justify-center sm:w-auto
                    ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-500 text-white hover:bg-blue-400'}
                    px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-md flex items-center
                  `}
                  onClick={handleDropdownToggle}
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                >
                  <IoIosAddCircle className="inline-block mr-2 text-lg" />
                  <span>Create Job Card</span>
                  <MdArrowDropDown className={`ml-1 text-xl transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                {isDropdownOpen && (
                  <div
                    className={`
                      ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                      absolute right-0 mt-2 w-full sm:w-56 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10
                    `}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex="-1"
                  >
                    <div className="py-1" role="none">
                      {items.length === 0 ? (
                        <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} px-4 py-2 text-sm`}>
                          No services available.
                        </div>
                      ) : (
                        items.map(item => (
                          <button
                            key={item.id}
                            className={`
                              ${isDarkMode ? 'text-gray-200 hover:bg-blue-600 hover:text-white' : 'text-gray-700 hover:bg-blue-500 hover:text-white'}
                              block w-full text-left px-4 py-2 text-sm transition-colors duration-200
                            `}
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => handleCreateJobCardClick(item.name)}
                          >
                            {item.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6`}>
        {services.length === 0 ? (
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} col-span-full text-center`}>No services found. Add some items to display here.</p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={`
                service-card cursor-pointer rounded-lg p-3 sm:p-4 shadow-md border-2
                ${selectedService === service.name
                  ? isDarkMode
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-blue-500 border-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                    : 'bg-white border-gray-300 hover:border-blue-500'
                }
                transition-all duration-300 flex items-center space-x-3
              `}
              onClick={() => setSelectedService(service.name)}
              aria-label={`Filter by ${service.name}`}
            >
              <div className={`
                ${selectedService === service.name
                  ? 'text-white'
                  : isDarkMode
                    ? 'text-blue-500'
                    : 'text-blue-500'
                } transition-colors duration-300
              `}>
                {service.icon}
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-lg">{service.name}</p>
                <p className={`text-xs sm:text-sm ${selectedService === service.name ? 'text-white' : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                  {service.jobs} Jobs
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={`status-filter ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-4 md:p-6 rounded-xl shadow-lg`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FiFilter className="text-blue-500 text-2xl" /> Filter by Status
          </h2>
          <button
            className={`
              text-blue-500 border border-blue-500 text-sm font-medium py-2 px-4 rounded-full shadow-sm
              hover:bg-blue-600 hover:text-white hover:border-transparent
              transition-all duration-300 w-full sm:w-auto
            `}
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="status-cards grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-4">
          {statuses.map((status) => {
            const CurrentStatusIcon = StatusIcons[status.status];
            const iconColorClass = StatusIconColors[status.status];

            return (
              <button
                key={status.status}
                className={`
                  status-card flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg shadow-md transition-all duration-300 transform border-2
                  ${selectedStatus === status.status
                    ? isDarkMode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-blue-500 text-white border-blue-500'
                    : isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600 border-gray-500'
                      : 'bg-white text-gray-800 hover:bg-gray-200 border-gray-300'
                  }
                `}
                onClick={() => setSelectedStatus(status.status)}
                aria-label={`Filter by ${status.text}`}
              >
                {CurrentStatusIcon && (
                  <CurrentStatusIcon className={`text-2xl sm:text-3xl ${selectedStatus === status.status ? 'text-white' : iconColorClass}`} />
                )}
                <span className={`text-xs sm:text-sm mt-2 text-center`}>
                  {status.text} <span className="font-semibold">({status.jobs})</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className={`${isDarkMode ? 'text-white' : 'text-black'} text-xl md:text-2xl font-semibold mb-4 mt-8`}>
        Filtered Jobs List ({filteredJobs.length} Jobs)
      </h2>

      {displayedJobs.length > 0 ? (
        <div className={`job-list space-y-4`}>
          {displayedJobs.map(job => {
            const trimmedStatus = job.status ? job.status.trim() : "";
            const CurrentStatusIcon = StatusIcons[trimmedStatus];
            const iconColorClass = StatusIconColors[trimmedStatus];

            return (
              <div
                key={job.id}
                className={`
                  job-card p-4 rounded-md shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between
                  transition-all duration-300 cursor-pointer group border-2
                  ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600 border-gray-700 hover:border-blue-500' : 'bg-white text-black hover:bg-gray-200 border-gray-200 hover:border-blue-500'}
                `}
                onClick={() => handleJobClick(job)}
                tabIndex="0"
                role="button"
              >
                <div className="flex flex-col flex-1 leading-tight mb-2 sm:mb-0">
                  <p className="text-base sm:text-lg font-bold flex items-center gap-2">
                    {job.title} - {job.jobNo}
                    {isJobNew(job.id) && (
                      <span className="bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full select-none">
                        New
                      </span>
                    )}
                  </p>
                  <div className="text-sm">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                      {job.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {job.area}
                    </span>
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      |
                    </span>
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {job.branch}
                    </span>
                  </div>
                  {job.status === "Cancelled" && job.cancellationReason && (
                    <div className={`mt-1 text-xs italic ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Reason: {job.cancellationReason}
                    </div>
                  )}
                  {job.status === "Cancelled" && job.cancellationDateTime && (
                    <div className={`mt-1 text-xs italic ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Cancelled on: {formatDateTime(job.cancellationDateTime)}
                    </div>
                  )}
                  {job.status === "Completed" && job.completedDateTime && (
                    <div className={`mt-1 text-xs italic ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      Completed on: {formatDateTime(job.completedDateTime)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs sm:text-base">
                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {job.status === "Cancelled" && job.cancellationDateTime ? (
                      <div>Created on: {formatDateTime(job.cancellationDateTime)}At </div>
                    ) : (
                      <div>Created on: {formatDateTime(job.createdAt)}</div>
                    )}
                  </div>
                  {CurrentStatusIcon && (
                    <CurrentStatusIcon className={`text-2xl sm:text-3xl ${iconColorClass}`} />
                  )}
                </div>
              </div>
            );
          })}
          {filteredJobs.length > jobsPerPage && (
            <div className={`flex items-center justify-center space-x-2 mt-6`}>
              <button
                className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                  currentPage === 1
                    ? 'cursor-not-allowed text-gray-400 bg-gray-600'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-blue-500 text-gray-300'
                      : 'bg-gray-200 hover:bg-blue-500 text-gray-800'
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                Prev
              </button>
              <div className="flex space-x-2">
                {renderPageButtons()}
              </div>
              <button
                className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                  currentPage === totalPages
                    ? 'cursor-not-allowed text-gray-400 bg-gray-600'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-blue-500 text-gray-300'
                      : 'bg-gray-200 hover:bg-blue-500 text-gray-800'
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No jobs found that match the selected filters.</p>
      )}
    </div>
  );
};

export default Home;