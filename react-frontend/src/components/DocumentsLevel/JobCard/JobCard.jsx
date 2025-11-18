import { useState, useContext, useEffect, useRef } from "react";
import { FaTrash, FaEdit, FaDownload, FaPrint, FaCheck,FaInfoCircle, FaChevronDown, FaChevronUp, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { ThemeContext } from "../../ThemeContext/ThemeContext";
import jsPDF from "jspdf";
import api from "../../../services/api"; // Use centralized api instance
import Notification from '../../Notification/Notification';
import { useAuth } from '../../../pages/hooks/useAuth';
import Calendar from '../../Calender/Calender';

const JobCard = ({ jobHomeId, jobNo, jobCardId: initialJobCardId, isJobCancelled = false, service, onJobCreated }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [jobCardId, setJobCardId] = useState(initialJobCardId || null);
  const [isEditing, setIsEditing] = useState(false); // Start in view mode
  const [selectedDate, setSelectedDate] = useState(""); // Initialize with empty string, will be set on fetch or current date
  const [showCalendar, setShowCalendar] = useState(false); // State to toggle calendar visibility
  const calendarRef = useRef(null); // Ref for calendar container
  
  // Add ref to track if edit was manually triggered
  const isManualEdit = useRef(false);
  const isDataLoaded = useRef(false); // Track if data has been loaded initially
  
  const { userRole, isLoading } = useAuth();

  // Helper functions for date formatting
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    // Return as YYYY-MM-DD
    return dateString;
  };

  const parseDateFromDisplay = (displayString) => {
    if (!displayString) return "";
    // Validate YYYY-MM-DD format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (regex.test(displayString)) {
      return displayString;
    }
    return "";
  };
  
  // Check if user has permission to edit job cards
  const canEditJobCards = userRole === 'Administrator' || userRole === 'Tecnical_Head' || userRole === 'Manager';
  // For technicians, they can create new job cards but not edit existing ones
  const canCreateJobCards = userRole === 'Administrator' || userRole === 'Tecnical_Head' || userRole === 'Manager';
  
  // FIXED: Simplified initial editing state logic
  useEffect(() => {
    if (!isLoading && !isDataLoaded.current) {
      // If this is a new job card and user can create job cards, enable editing
      if (!initialJobCardId && canCreateJobCards) {
        setIsEditing(true);
        setOriginalFields({...fields});
        setOriginalFilters({...filters});
        setOriginalItems(items.map(item => ({...item})));
        setOriginalSelectedDate(selectedDate);
        setSelectedDate(new Date().toISOString().split('T')[0]);
        isDataLoaded.current = true;
      }
      // For existing job cards, always start in view mode - user must click edit
      else if (initialJobCardId) {
        setIsEditing(true);
      }
    }
  }, [isLoading, initialJobCardId, canCreateJobCards]); // Removed canEditJobCards to prevent conflicts

  const [fields, setFields] = useState({
    customer_name: "", fam_no: "", contact_person: "", area: "",
    contact_number: "", branch_sc: "", generator_make: "", kva: "",
    engine_make: "", last_service: "", alternator_make: "",
    gen_model: "", controller_module: "", avr: "", ats_info: "",
    job_description: "",
    engine_se_no: "",
    alternator_se_no: ""
  });

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [areas, setAreas] = useState([]);
  const [branches, setBranches] = useState([]);

  const [filters, setFilters] = useState({
    oil_filter: false, oil_filter_desc: "",
    fuel_filter: false, fuel_filter_desc: "",
    air_filter: false, air_filter_desc: "",
    battery_charge: false, battery_charge_desc: "",
    oil: false, oil_desc: "",
    battery: "", other: "",
  });

  const [items, setItems] = useState([{ materialsNo: "", materials: "", quantity: "" }]);

  // --- State for original values when editing ---
  const [originalFields, setOriginalFields] = useState({});
  const [originalFilters, setOriginalFilters] = useState({});
  const [originalItems, setOriginalItems] = useState([]);
  const [originalSelectedDate, setOriginalSelectedDate] = useState("");

  // --- State for Section Expansion ---
  const [expandedSections, setExpandedSections] = useState({
    customerInfo: true, // Changed from jobCardInfo to customerInfo
    jobCardInfo: true, // Add separate state for job card info
    serviceChecklist: true,
    serviceReport: true,
    itemsReplaced: true,
  });

  // Toggle function for sections
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // --- Notification State (FIXED: Removed duplicates) ---
  const [notification, setNotification] = useState({ message: "", type: "" }); // type: 'success' or 'error'

  // Function to show notification (FIXED: Removed duplicates)
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: "", type: "" });
    }, 5000); // Hide after 5 seconds
  };

  // --- Handlers ---
  const handleFieldChange = (e) => {
    if (!isEditing) return; // Prevent changes if not in editing mode
    const { name, value } = e.target;
    setFields({ ...fields, [name]: value });

    if (name === "customer_name") {
      const selectedCustomer = customers.find(cust => cust.customer_name === value);
      setSelectedCustomerId(selectedCustomer ? selectedCustomer.id : null); // Use customer.id as per backend
    }
  };

  const handleFilterChange = (e) => {
    if (!isEditing) return; // Prevent changes if not in editing mode
    const { name, type, checked, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleItemChange = (i, field, value) => {
    if (!isEditing) return;
    const newItems = [...items];
    newItems[i][field] = value;

    // Auto-generate materialsNo for the last row if empty and materials or quantity is filled
    if (field !== "materialsNo" && i === newItems.length - 1) {
      if ((newItems[i].materials !== "" || newItems[i].quantity !== "") && newItems[i].materialsNo === "") {
        newItems[i].materialsNo = String(i + 1);
      }
    }

    // Add new empty row if the last row is being filled
    const lastItem = newItems[newItems.length - 1];
    if (isEditing && i === newItems.length - 1 && (lastItem.materialsNo !== "" || lastItem.materials !== "" || lastItem.quantity !== "")) {
      newItems.push({ materialsNo: "", materials: "", quantity: "" });
    }
    setItems(newItems);
  };

  const handleDeleteRow = (i) => {
    if (!isEditing) return;
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!isEditing) return;

    // Additional check for user permissions
    if (!canCreateJobCards && !canEditJobCards) {
      showNotification("You don't have permission to submit job cards.", "error");
      return;
    }

    // Filter out empty items before sending
    const filteredItems = items.filter(item =>
      item.materialsNo !== "" || item.materials !== "" || item.quantity !== ""
    );

    let currentJobHomeId = jobHomeId;

    // If this is a new job (no jobHomeId), create JobHome first
    if (!jobHomeId && !jobCardId) {
      if (!selectedCustomerId) {
        showNotification("Please select a customer before creating the job card.", "error");
        return;
      }

      try {
        const jobHomePayload = {
          customer_id: selectedCustomerId,
          job_type: service, // Assuming service prop is passed from JobHome
          job_status: "Pending"
        };

        const jobHomeRes = await api.post("/job-homes", jobHomePayload);

        currentJobHomeId = jobHomeRes.data.job_home.id;
        console.log("JobHome created:", jobHomeRes.data);
      } catch (err) {
        console.error("JobHome creation failed:", err);
        showNotification("Failed to create job home.", "error");
        return;
      }
    }

    const payload = {
      job_home_id: currentJobHomeId,
      selected_date: selectedDate,
      ...fields,
      customer_id: selectedCustomerId,
      oil_filter_state: filters.oil_filter || false,
      oil_filter_value: filters.oil_filter ? (filters.oil_filter_desc || "") : "",
      air_filter_state: filters.air_filter || false,
      air_filter_value: filters.air_filter ? (filters.air_filter_desc || "") : "",
      oil_state: filters.oil || false,
      oil_value: filters.oil ? (filters.oil_desc || "") : "",
      fuel_filter_state: filters.fuel_filter || false,
      fuel_filter_value: filters.fuel_filter ? (filters.fuel_filter_desc || "") : "",
      battery_charge_state: filters.battery_charge || false,
      battery_charge_value: filters.battery_charge ? (filters.battery_charge_desc || "") : "",
      battery_value: filters.battery || "",
      other_value: filters.other || "",
      items: filteredItems,
    };

    console.log("Submitting payload:", payload);

    const url = jobCardId
      ? `http://localhost:8000/api/jobcards/${jobCardId}`
      : "http://localhost:8000/api/jobcards";

    const method = jobCardId ? "PUT" : "POST";

    try {
      const res = await api({
        method: method,
        url: url,
        data: payload,
      });
      const data = res.data;
      console.log("Result:", data);
      showNotification(jobCardId ? "Updated successfully." : "Submitted successfully.", "success");

      if (!jobCardId && data.id) {
        setJobCardId(data.id);
      }
      
      // Reset manual edit flag and disable editing
      isManualEdit.current = false;
      setIsEditing(false);

      // If this was a new job, fetch the full job data and call onJobCreated
      if (!jobHomeId && onJobCreated) {
        try {
          const fullJobRes = await api.get(`/job-homes/${currentJobHomeId}`);
          onJobCreated(fullJobRes.data);
        } catch (fetchErr) {
          console.error("Failed to fetch full job data:", fetchErr);
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
      if (err.response && err.response.status === 409) {
        // Conflict error - job card already exists
        const existingId = err.response.data.id;
        showNotification("Job card already exists. Switching to update mode.", "error");
        setJobCardId(existingId);
        isManualEdit.current = false;
        setIsEditing(false);
      } else if (err.response && err.response.data && err.response.data.message) {
        showNotification(`Submission failed: ${err.response.data.message}`, "error");
      } else {
        showNotification("Submission failed.", "error");
      }
    }
  };

  // FIXED: Simplified handleEdit function
  const handleEdit = () => {
    console.log("Edit button clicked, canEditJobCards:", canEditJobCards, "current isEditing:", isEditing);
    
    if (canEditJobCards) {
      // Set manual edit flag to prevent useEffects from interfering
      isManualEdit.current = true;
      
      // Store original values before editing
      setOriginalFields({...fields});
      setOriginalFilters({...filters});
      setOriginalItems(items.map(item => ({...item})));
      setOriginalSelectedDate(selectedDate);
      
      // Set editing state using functional update to ensure we get latest state
      setIsEditing(prevIsEditing => {
        console.log("Setting isEditing from", prevIsEditing, "to true");
        return true;
      });
    } else {
      showNotification("You don't have permission to edit job cards.", "error");
    }
  };

  // FIXED: Reset manual edit flag in cancel
  const handleCancel = () => {
    isManualEdit.current = false; // Reset manual edit flag
    setFields(originalFields);
    setFilters(originalFilters);
    setItems(originalItems.map(item => ({...item})));
    setSelectedDate(originalSelectedDate);
    setIsEditing(false);
  };

  // --- Data Fetching Effects ---
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers");
        setCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  // FIXED: Modified Job Card data fetching to not interfere with manual editing
  useEffect(() => {
    const fetchJobCardData = async () => {
      if (jobCardId) {
        try {
          const response = await api.get(`/jobcards/${jobCardId}`);
          const data = response.data;
          setFields({
            customer_name: data.customer_name || "",
            fam_no: data.fam_no || "",
            contact_person: data.contact_person || "",
            area: data.area || "",
            contact_number: data.contact_number || "",
            branch_sc: data.branch_sc || "",
            generator_make: data.generator_make || "",
            kva: data.kva || "",
            engine_make: data.engine_make || "",
            last_service: data.last_service || "",
            alternator_make: data.alternator_make || "",
            gen_model: data.gen_model || "",
            controller_module: data.controller_module || "",
            avr: data.avr || "",
            ats_info: data.ats_info || "",
            job_description: data.job_description || "",
            engine_se_no: data.engine_se_no || "",
            alternator_se_no: data.alternator_se_no || ""
          });

          // Set selectedDate from fetched data, or default if not present
          setSelectedDate(data.selected_date ? data.selected_date.split('T')[0] : "");

          // Set customer_id
          const foundCustomer = customers.find(c => c.customer_name === data.customer_name);
          if (foundCustomer) {
            setSelectedCustomerId(foundCustomer.id);
          }

          // Populate filters
          const fetchedFilters = {
            oil_filter: data.oil_filter_state || false,
            oil_filter_desc: data.oil_filter_value || "",
            fuel_filter: data.fuel_filter_state || false,
            fuel_filter_desc: data.fuel_filter_value || "",
            air_filter: data.air_filter_state || false,
            air_filter_desc: data.air_filter_value || "",
            battery_charge: data.battery_charge_state || false,
            battery_charge_desc: data.battery_charge_value || "",
            oil: data.oil_state || false,
            oil_desc: data.oil_value || "",
            battery: data.battery_value || "",
            other: data.other_value || "",
          };
          setFilters(fetchedFilters);

          // Populate items, ensure at least one empty row for editing if none exist
          if (data.items && data.items.length > 0) {
            // Map backend 'materials_no' to frontend 'materialsNo'
            const mappedItems = data.items.map(item => ({
              materialsNo: item.materials_no || "",
              materials: item.materials || "",
              quantity: item.quantity || ""
            }));
            setItems([...mappedItems, { materialsNo: "", materials: "", quantity: "" }]);
          } else {
            setItems([{ materialsNo: "", materials: "", quantity: "" }]);
          }

          // CRITICAL FIX: Only set isEditing to false if this is NOT a manual edit
          if (!isManualEdit.current) {
            setIsEditing(false);
          }
          
          // Mark data as loaded
          isDataLoaded.current = true;
          
          console.log("Data fetched successfully, isEditing:", !isManualEdit.current ? "set to false" : "left unchanged");
        } catch (error) {
          console.error("Error fetching job card data:", error);
          showNotification("Failed to fetch job card data.", "error");
        }
      } else {
        // If creating a new job card, set current date as default
        setSelectedDate(new Date().toISOString().split('T')[0]);
        isDataLoaded.current = true;
      }
    };
    fetchJobCardData();
  }, [jobCardId, customers]); // Keep dependencies as they are

  // Update areas and branches based on selected customer and area
  useEffect(() => {
    const selectedCustomer = customers.find(cust => cust.customer_name === fields.customer_name);
    if (selectedCustomer) {
      setAreas(selectedCustomer.areas || []);
      const selectedArea = (selectedCustomer.areas || []).find(area => area.areaName === fields.area);
      setBranches(selectedArea?.branches || []);
    } else {
      setAreas([]);
      setBranches([]);
    }
  }, [fields.customer_name, fields.area, customers]);

  // Handle outside click to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // --- PDF Generation Logic ---
  const createPDFDocument = () => {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (2 * margin);
    let y = margin;

    // Helper functions
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    };

    const addPageHeader = () => {
      // Company Letterhead
      doc.setFillColor(41, 128, 185); // Professional blue
      doc.rect(0, 0, pageWidth, 80, 'F');

      // Company Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("MAGMA ENGINEERING SOLUTIONS", pageWidth / 2, 30, { align: "center" });

      // Tagline
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text("Excellence in Engineering Solutions", pageWidth / 2, 45, { align: "center" });

      // Contact Information
      doc.setFontSize(10);
      doc.text("123 Engineering Avenue, Colombo 05, Sri Lanka", pageWidth / 2, 60, { align: "center" });
      doc.text("Tel: +94 11 234 5678 | Email: info@magmaengineering.lk | Web: www.magmaengineering.lk", pageWidth / 2, 72, { align: "center" });

      // Reset text color
      doc.setTextColor(0, 0, 0);
      return 110;
    };

    const addPageFooter = (pageNum, totalPages) => {
      const footerY = pageHeight - 40;

      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

      // Footer text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);

      doc.text("This is a computer generated job card and does not require signature.", margin, footerY);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });

      // Terms
      doc.setFontSize(6);
      doc.text("Terms & Conditions: All services are subject to standard terms and conditions. Warranty applies as per service agreement.", margin, footerY + 10);
    };

    const checkPageBreak = (requiredHeight) => {
      if (y + requiredHeight > pageHeight - 80) {
        addPageFooter(currentPage, totalPages);
        doc.addPage();
        currentPage++;
        y = addPageHeader();
        return true;
      }
      return false;
    };

    // Safely handle all field values
    const safeText = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return String(value).trim() || 'N/A';
    };

    // Initialize document
    let currentPage = 1;
    let totalPages = 1; // Will be updated later
    y = addPageHeader();

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text("JOB CARD", pageWidth / 2, y, { align: "center" });
    y += 40;

    // Job Card Details Box
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 80, 'FD');

    // Job Card Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("JOB CARD DETAILS", margin + 10, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const jobCardDetails = [
      { label: "Job Card No:", value: safeText(jobCardId) },
      { label: "Service Date:", value: formatDate(selectedDate) },
      { label: "FAM No:", value: safeText(fields.fam_no) },
      { label: "Service Type:", value: "Maintenance" }
    ];

    let detailY = y + 35;
    jobCardDetails.forEach((detail, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + 10 + (col * 200);

      doc.setFont("helvetica", "bold");
      doc.text(detail.label, x, detailY + (row * 15));
      doc.setFont("helvetica", "normal");
      doc.text(detail.value, x + 80, detailY + (row * 15));
    });

    y += 100;

    // Customer Information Section
    checkPageBreak(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text("CUSTOMER INFORMATION", margin, y);
    y += 20;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const customerInfo = [
      ["Customer Name:", safeText(fields.customer_name), "Contact Person:", safeText(fields.contact_person)],
      ["Contact Number:", safeText(fields.contact_number), "Area:", safeText(fields.area)],
      ["Branch/SC:", safeText(fields.branch_sc), "", ""]
    ];

    customerInfo.forEach(row => {
      if (row[0] && row[1]) {
        doc.setFont("helvetica", "bold");
        doc.text(row[0], margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(row[1], margin + 100, y);
      }
      if (row[2] && row[3]) {
        doc.setFont("helvetica", "bold");
        doc.text(row[2], margin + 250, y);
        doc.setFont("helvetica", "normal");
        doc.text(row[3], margin + 350, y);
      }
      y += 15;
    });

    y += 20;

    // Generator Information Section
    checkPageBreak(150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text("GENERATOR INFORMATION", margin, y);
    y += 20;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const generatorInfo = [
      ["Generator Make:", safeText(fields.generator_make), "KVA:", safeText(fields.kva)],
      ["Engine Make:", safeText(fields.engine_make), "Engine Serial No:", safeText(fields.engine_se_no)],
      ["Alternator Make:", safeText(fields.alternator_make), "Alternator Serial No:", safeText(fields.alternator_se_no)],
      ["Gen Model:", safeText(fields.gen_model), "Last Service:", safeText(fields.last_service)],
      ["Controller Module:", safeText(fields.controller_module), "AVR:", safeText(fields.avr)]
    ];

    generatorInfo.forEach(row => {
      if (row[0] && row[1]) {
        doc.setFont("helvetica", "bold");
        doc.text(row[0], margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(row[1], margin + 100, y);
      }
      if (row[2] && row[3]) {
        doc.setFont("helvetica", "bold");
        doc.text(row[2], margin + 250, y);
        doc.setFont("helvetica", "normal");
        doc.text(row[3], margin + 350, y);
      }
      y += 15;
    });

    y += 20;

    // Service Checklist Section
    checkPageBreak(120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text("SERVICE CHECKLIST", margin, y);
    y += 20;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Service checklist items
    const checklistItems = [
      { label: "Oil Filter", status: filters.oil_filter, desc: filters.oil_filter_desc },
      { label: "Fuel Filter", status: filters.fuel_filter, desc: filters.fuel_filter_desc },
      { label: "Air Filter", status: filters.air_filter, desc: filters.air_filter_desc },
      { label: "Battery Charge", status: filters.battery_charge, desc: filters.battery_charge_desc },
      { label: "Oil", status: filters.oil, desc: filters.oil_desc }
    ];

    checklistItems.forEach(item => {
      const statusText = item.status ? "✓ Done" : "✗ Not Done";
      const descText = item.desc ? ` - ${item.desc}` : "";

      doc.setFont("helvetica", "bold");
      doc.text(`${item.label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${statusText}${descText}`, margin + 80, y);
      y += 15;
    });

    // Additional fields
    if (filters.battery) {
      doc.setFont("helvetica", "bold");
      doc.text("Battery Details:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(safeText(filters.battery), margin + 80, y);
      y += 15;
    }

    if (filters.other) {
      doc.setFont("helvetica", "bold");
      doc.text("Other Remarks:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(safeText(filters.other), margin + 80, y);
      y += 15;
    }

    y += 20;

    // Service Report Section
    checkPageBreak(100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text("SERVICE REPORT", margin, y);
    y += 20;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // ATS Information
    if (fields.ats_info && safeText(fields.ats_info) !== 'N/A') {
      doc.setFont("helvetica", "bold");
      doc.text("ATS Information:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(safeText(fields.ats_info), margin + 100, y);
      y += 15;
    }

    // Job Description
    if (fields.job_description && safeText(fields.job_description) !== 'N/A') {
      doc.setFont("helvetica", "bold");
      doc.text("Job Description:", margin, y);
      y += 15;

      doc.setFont("helvetica", "normal");
      const splitDescription = doc.splitTextToSize(safeText(fields.job_description), contentWidth - 20);
      doc.text(splitDescription, margin, y);
      y += splitDescription.length * 12 + 10;
    }

    // Items Table
    checkPageBreak(150);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text("ITEMS/MATERIALS REPLACED", margin, y);
    y += 20;

    // Table Header
    doc.setFillColor(41, 128, 185);
    doc.rect(margin, y - 5, contentWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);

    const columns = [
      { header: "No", width: 30, x: margin + 5 },
      { header: "Materials No", width: 80, x: margin + 35 },
      { header: "Description", width: 180, x: margin + 115 },
      { header: "Quantity", width: 60, x: margin + 295 }
    ];

    columns.forEach(col => {
      doc.text(col.header, col.x, y + 8);
    });

    y += 25;
    doc.setTextColor(0, 0, 0);

    // Table Rows
    const validItems = items.filter(item =>
      item.materialsNo !== "" || item.materials !== "" || item.quantity !== ""
    );

    validItems.forEach((item, index) => {
      checkPageBreak(20);

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, y - 5, contentWidth, 18, 'F');
      }

      // Table borders
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(margin, y - 5, contentWidth, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const rowData = [
        (index + 1).toString(),
        safeText(item.materialsNo),
        safeText(item.materials),
        safeText(item.quantity)
      ];

      columns.forEach((col, colIndex) => {
        const text = String(rowData[colIndex] || "");
        if (colIndex === 2) { // Description column - wrap text
          const wrappedText = doc.splitTextToSize(text, col.width - 5);
          doc.text(wrappedText, col.x, y + 5);
        } else {
          doc.text(text, col.x, y + 5);
        }
      });

      y += 18;
    });

    // Table bottom border
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    y += 30;

    // Signature Section
    checkPageBreak(80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text("AUTHORIZATION", margin, y);
    y += 20;

    // Signature lines
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    doc.line(margin, y, margin + 150, y);
    doc.line(margin + 200, y, margin + 350, y);
    doc.line(margin + 400, y, pageWidth - margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);

    doc.text("Technician", margin + 50, y + 15, { align: "center" });
    doc.text("Supervisor", margin + 275, y + 15, { align: "center" });
    doc.text("Customer", pageWidth - margin - 50, y + 15, { align: "center" });

    // Update total pages and add footer to all pages
    totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      if (i === 1) {
        // First page already has header
        addPageFooter(i, totalPages);
      } else {
        addPageFooter(i, totalPages);
      }
    }

    return doc;
  };

  const savePDF = () => {
    const doc = createPDFDocument();
    doc.save(`jobcard_${jobNo || 'new'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDownload = () => {
    savePDF();
  };

  const handlePrint = () => {
    const doc = createPDFDocument();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    } else {
      alert('Please allow popups for this website');
    }
  };

  // --- Component Render ---
  return (
    <div className={`w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl mt-4 sm:mt-6 md:mt-8 transition-colors duration-300 ${
      isJobCancelled
        ? (isDarkMode ? 'bg-gray-900 text-gray-50 border border-gray-700' : 'bg-white text-gray-900 border border-gray-200')
        : isDarkMode
          ? 'bg-gray-900 text-gray-50 border border-gray-700'
          : 'bg-white text-gray-900 border border-gray-200'
    }`}>
      {/* Modern Notification Toast */}
      {notification.message && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm border text-white transform transition-all duration-500 ease-out animate-slide-in ${
            notification.type === "success" 
              ? "bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-400/20" 
              : "bg-gradient-to-r from-red-500 to-rose-600 border-red-400/20"
          }`}
          role="alert"
          style={{
            boxShadow: notification.type === "success" 
              ? "0 25px 50px -12px rgba(34, 197, 94, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)" 
              : "0 25px 50px -12px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)"
          }}
        >
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              notification.type === "success" ? "bg-white/20" : "bg-white/20"
            }`}>
              {notification.type === "success" ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm leading-tight">{notification.message}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-white/20 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full animate-progress" 
              style={{
                animation: 'progress 5s linear forwards'
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }

        .animate-progress {
          animation: progress 5s linear forwards;
        }

        .date-input-no-calendar::-webkit-calendar-picker-indicator {
          display: none;
        }

        .date-input-no-calendar::-webkit-inner-spin-button {
          display: none;
        }

        .date-input-no-calendar::-webkit-outer-spin-button {
          display: none;
        }

        .date-input-no-calendar {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} `}>
          Job Card
        </h2>
         
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {
            userRole !== 'Technician' && (!isEditing || !jobCardId) && (
              <button
                onClick={handleEdit}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
              >
                <FaEdit className="mr-2 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Edit</span>
              </button>
            )
          }
          { isEditing && (
            <button
              onClick={handleCancel}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              <FaTimes className="mr-2 text-xs sm:text-sm" />
              <span className="text-xs sm:text-sm">Cancel</span>
            </button>
          ) }

            <>
              <button
                onClick={handleDownload}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                <FaDownload className="mr-2 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                <FaPrint className="mr-2 text-xs sm:text-sm" />
                <span className="text-xs sm:text-sm">Print</span>
              </button>
            </>
        </div>
      </div>

      {/* Customer Information Section */}
      <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div
          className="flex justify-between items-center cursor-pointer mb-4 sm:mb-6"
          onClick={() => toggleSection('customerInfo')}
        >
          <h3
            className={`text-xl sm:text-2xl font-semibold ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            } flex items-center`}
            >
            <FaInfoCircle className="mr-2 text-blue-400" /> Customer Information
          </h3>
          {expandedSections.customerInfo ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        <div
          className={`overflow-visible transition-all duration-500 ease-in-out ${expandedSections.customerInfo ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ maxHeight: expandedSections.customerInfo ? '1000px' : '0' }} // A large enough value
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Date Picker */}
            <div className="col-span-full mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className={`font-semibold text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date:</label>
              <div className="relative flex items-center w-full sm:w-auto flex-grow">
                <input
                  type="text"
                  value={formatDateForDisplay(selectedDate)}
                  onChange={(e) => {
                    if (!isEditing) return;
                    const parsedDate = parseDateFromDisplay(e.target.value);
                    if (parsedDate) {
                      setSelectedDate(parsedDate);
                    } else {
                      // If invalid format, keep the input as is (optional: add validation feedback)
                      setSelectedDate("");
                    }
                  }}
                  readOnly={!isEditing}
                  placeholder="yyyy-mm-dd"
                  className={`w-full px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl border-2 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 transition-all duration-200 ${!isEditing ? 'cursor-not-allowed opacity-70' : ''} date-input-no-calendar`}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`absolute right-2 p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors duration-200`}
                  >
                    <FaCalendarAlt className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                )}
                {showCalendar && isEditing && (
                  <div ref={calendarRef} className="absolute top-full left-0 z-10 mt-1 overflow-visible">
                    <Calendar
                      selectedDate={selectedDate ? new Date(selectedDate) : null}
                      onDateSelect={(date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const formattedDate = `${year}-${month}-${day}`;
                        setSelectedDate(formattedDate);
                        setShowCalendar(false);
                      }}
                      minDate={(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return today;
                      })()}
                    />
                  </div>
                )}
              </div>
             
            </div>

            {/* Customer Name */}
            <div>
              <label htmlFor="customer_name" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer Name:</label>
              <select
                id="customer_name"
                name="customer_name"
                value={fields.customer_name}
                onChange={handleFieldChange}
                disabled={!isEditing}
                className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.customer_name}>
                    {customer.customer_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Other Customer Fields */}
            {[
              { name: "area", label: "Area", type: "select", options: areas.map(a => ({ value: a.areaName, label: a.areaName })) },
              { name: "branch_sc", label: "Branch/SC", type: "select", options: branches.map(b => ({ value: b.branchName, label: b.branchName })) },
              { name: "contact_number", label: "Contact Number" },
              { name: "contact_person", label: "Contact Person" },
            ].map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{field.label}:</label>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={fields[field.name]}
                    onChange={handleFieldChange}
                    disabled={!isEditing}
                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <option value="">{`Select ${field.label}`}</option>
                    {field.options.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id={field.name}
                    name={field.name}
                    value={fields[field.name]}
                    onChange={handleFieldChange}
                    readOnly={!isEditing}
                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Card Details Section */}
      <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div
          className="flex justify-between items-center cursor-pointer mb-4 sm:mb-6"
          onClick={() => toggleSection('jobCardInfo')}
        >
          <h3
            className={`text-xl sm:text-2xl font-semibold ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            } flex items-center`}
            >
            <FaInfoCircle className="mr-2 text-blue-400" /> Job Card Information
          </h3>
          {expandedSections.jobCardInfo ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSections.jobCardInfo ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ maxHeight: expandedSections.jobCardInfo ? '1000px' : '0' }} // A large enough value
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Job Card Fields */}
            {[
            { name: "fam_no", label: "FAM No" },
            { name: "generator_make", label: "Generator Make" },
            { name: "kva", label: "KVA" },
            { name: "engine_make", label: "Engine Make" },
            { name: "engine_se_no", label: "Engine Serial No" },
            { name: "last_service", label: "Last Service" },
            { name: "alternator_make", label: "Alternator Make" },
            { name: "alternator_se_no", label: "Alternator Serial No" },
            { name: "gen_model", label: "Gen Model" },
            { name: "controller_module", label: "Controller Module" },
            { name: "avr", label: "AVR" },
            ].map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className={`block text-sm sm:text-base font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{field.label}:</label>
                <input
                  type="text"
                  id={field.name}
                  name={field.name}
                  value={fields[field.name]}
                  onChange={handleFieldChange}
                  readOnly={!isEditing}
                  className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters and Battery Section */}
      <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div
          className="flex justify-between items-center cursor-pointer mb-4 sm:mb-6"
          onClick={() => toggleSection('serviceChecklist')}
        >
          <h3
            className={`text-xl sm:text-2xl font-semibold ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            } flex items-center`}
            >
            <FaInfoCircle className="mr-2 text-blue-400" /> Service Checklist
          </h3>
          {expandedSections.serviceChecklist ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSections.serviceChecklist ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ maxHeight: expandedSections.serviceChecklist ? '1000px' : '0' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {["oil_filter", "fuel_filter", "air_filter", "battery_charge", "oil"].map((name) => (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4" key={name}>
                <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                  <input
                    type="checkbox"
                    id={name}
                    name={name}
                    checked={filters[name] || false}
                    onChange={handleFilterChange}
                    disabled={!isEditing}
                    className={`h-5 w-5 sm:h-6 sm:w-6 rounded text-blue-600 focus:ring-blue-500 transition-all duration-200 ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-200 border-gray-300'}`}
                  />
                  <label htmlFor={name} className={`font-medium capitalize flex-grow ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {name.replace(/_/g, " ")}:
                  </label>
                </div>
                <input
                  type="text"
                  name={`${name}_desc`}
                  value={filters[`${name}_desc`] || ""}
                  onChange={handleFilterChange}
                  readOnly={!isEditing}
                  placeholder="Description (if any)"
                  className={`w-full sm:w-1/2 border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                />
              </div>
            ))}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 col-span-full">
              <label htmlFor="battery" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Battery Details:</label>
              <input
                type="text"
                id="battery"
                name="battery"
                value={filters.battery || ""}
                onChange={handleFilterChange}
                readOnly={!isEditing}
                className={`w-full sm:flex-grow border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 col-span-full">
              <label htmlFor="other" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Other Remarks:</label>
              <input
                type="text"
                id="other"
                name="other"
                value={filters.other || ""}
                onChange={handleFilterChange}
                readOnly={!isEditing}
                className={`w-full sm:flex-grow border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ATS Info and Job Description */}
      <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div
          className="flex justify-between items-center cursor-pointer mb-4 sm:mb-6"
          onClick={() => toggleSection('serviceReport')}
        >
          <h3
            className={`text-xl sm:text-2xl font-semibold ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            } flex items-center`}
            >
            <FaInfoCircle className="mr-2 text-blue-400" /> Service Report
          </h3>
          {expandedSections.serviceReport ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSections.serviceReport ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ maxHeight: expandedSections.serviceReport ? '1000px' : '0' }}
        >
          <div className="mb-4 sm:mb-6">
            <label htmlFor="ats_info" className={`block text-sm sm:text-base font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>ATS Information:</label>
            <input
              type="text"
              id="ats_info"
              name="ats_info"
              value={fields.ats_info}
              onChange={handleFieldChange}
              readOnly={!isEditing}
              className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
            />
          </div>
          <div>
            <label htmlFor="job_description" className={`block text-sm sm:text-base font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Description:</label>
            <textarea
              id="job_description"
              name="job_description"
              value={fields.job_description}
              onChange={handleFieldChange}
              readOnly={!isEditing}
              rows="4"
              className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
            />
          </div>
        </div>
      </section>

      {/* Items Table */}
      <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div
          className="flex justify-between items-center cursor-pointer mb-4 sm:mb-6"
          onClick={() => toggleSection('itemsReplaced')}
        >
          <h3
            className={`text-xl sm:text-2xl font-semibold ${
              isDarkMode ? "text-gray-200" : "text-gray-700"
            } flex items-center`}
            >
            <FaInfoCircle className="mr-2 text-blue-400" /> Items/Materials Replaced
          </h3>
          {expandedSections.itemsReplaced ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedSections.itemsReplaced ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ maxHeight: expandedSections.itemsReplaced ? '1000px' : '0' }}
        >
          <div className="overflow-x-auto">
            <table className={`w-full text-left rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <thead className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-blue-100 text-blue-800'}`}>
                <tr>
                  <th className="p-2 sm:p-4 border-b-2 border-r-2 rounded-tl-lg text-xs sm:text-sm md:text-base">Action</th>
                  <th className="p-2 sm:p-4 border-b-2 border-r-2 text-xs sm:text-sm md:text-base">Materials No</th>
                  <th className="p-2 sm:p-4 border-b-2 border-r-2 text-xs sm:text-sm md:text-base">Materials</th>
                  <th className="p-2 sm:p-4 border-b-2 rounded-tr-lg text-xs sm:text-sm md:text-base">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50')}`}>
                    <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {isEditing && (
                        <button
                          onClick={() => handleDeleteRow(index)}
                          className={`text-red-500 hover:text-red-700 transition-colors duration-200 ${isDarkMode ? 'hover:text-red-400' : ''}`}
                          title="Delete Row"
                        >
                          <FaTrash className="text-sm sm:text-base" />
                        </button>
                      )}
                    </td>
                    <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <input
                        type="text"
                        value={item.materialsNo}
                        readOnly={!isEditing}
                        onChange={(e) => handleItemChange(index, "materialsNo", e.target.value)}
                        className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                      />
                    </td>
                    <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <input
                        type="text"
                        value={item.materials}
                        readOnly={!isEditing}
                        onChange={(e) => handleItemChange(index, "materials", e.target.value)}
                        className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                      />
                    </td>
                    <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <input
                        type="text"
                        value={item.quantity}
                        readOnly={!isEditing}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow only integers (including empty string for typing)
                          if (/^\d*$/.test(value)) {
                            handleItemChange(index, "quantity", value === '' ? '' : parseInt(value, 10));
                          }
                        }}
                        className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${
                          isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                        } ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end mt-6 sm:mt-8">
        {isJobCancelled ? (
          <div className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg transition-all duration-300 flex items-center ${isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}>
            <FaInfoCircle className="mr-2 sm:mr-3 text-base sm:text-lg" />
            <span className="text-sm sm:text-base">Job Card Submission Disabled</span>
          </div>
        ) : (
          isEditing && (
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <FaCheck className="mr-2 sm:mr-3 text-base sm:text-lg" />
              <span className="text-sm sm:text-base">{jobCardId ? "Update Job Card" : "Create Job Card"}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default JobCard;