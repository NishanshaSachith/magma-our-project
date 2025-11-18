import { useState, useContext, useEffect, useRef } from "react";
import { FaCalendarAlt, FaTrash, FaDownload,FaInfoCircle, FaPrint, FaCheck, FaEdit, FaChevronDown, FaChevronUp, FaTimes} from "react-icons/fa"; // Added chevron icons
import { ThemeContext } from "../../ThemeContext/ThemeContext";
import Notification from '../../Notification/Notification';
import { useAuth } from "../../../pages/hooks/useAuth";
import api from '../../../services/api';
import LoadingItems from "../../Loading/LoadingItems";
import Calendar from '../../Calender/Calender';
import jsPDF from "jspdf";

const Quotation = ({ jobCardId, jobNo, onQuotationCreated, isJobCancelled = false }) => {
    const { isDarkMode } = useContext(ThemeContext);
    //console.log('jobCardId:', jobCardId);

    // Helper function to format date in local time to avoid timezone issues
    const formatLocalDate = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const [selectedDate, setSelectedDate] = useState("");
    const todayLocalStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    const [TenderSignedDate, setTenderSignedDate] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    //const [quotationData, setQuotationData] = useState(null);

    // State for managing expanded/collapsed sections
    const [isQuotationInfoExpanded, setIsQuotationInfoExpanded] = useState(true);
    const [isTenderInfoExpanded, setIsTenderInfoExpanded] = useState(true);
    const [isItemsTableExpanded, setIsItemsTableExpanded] = useState(true); // Added for items table  
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
    const [isSpecialNoteExpanded, setIsSpecialNoteExpanded] = useState(true);
    // Destructure all relevant states from the useAuth hook, including isLoading and isAuthenticated
    const { isAuthenticated, userRole } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [fields, setFields] = useState({
        attention: "",
        quotation_no: "",
        region: "",
        ref_qtn: "",
        site: "",
        job_date: "",
        fam_no: "",
        complain_nature: "",
        po_no: "",
        po_date: "",
        tender_no: "",
        special_note: ""
    });

    const [items, setItems] = useState([{ materialsNo: "", description: "", unitPrice: "", quantity: "", unitTotalPrice: "" }]);
    const [vatValue, setVatValue] = useState(0);
    const [discountValue, setDiscountValue] = useState(0);
    //const [items, setItems] = useState([]);
const [quotation, setQuotation] = useState(null);

// Store original data for cancel functionality
const [originalFields, setOriginalFields] = useState({});
const [originalItems, setOriginalItems] = useState([]);
const [originalSelectedDate, setOriginalSelectedDate] = useState("");
const [originalTenderSignedDate, setOriginalTenderSignedDate] = useState("");
const [originalVatValue, setOriginalVatValue] = useState(0);
const [originalDiscountValue, setOriginalDiscountValue] = useState(0);

// Calendar states
const [showCalendarSelected, setShowCalendarSelected] = useState(false);
const [showCalendarJob, setShowCalendarJob] = useState(false);
const [showCalendarPO, setShowCalendarPO] = useState(false);
const [showCalendarTender, setShowCalendarTender] = useState(false);

// Calendar refs for outside click detection
const calendarSelectedRef = useRef(null);
const calendarJobRef = useRef(null);
const calendarPORef = useRef(null);
const calendarTenderRef = useRef(null);

// useEffect for outside click detection for selected date calendar
useEffect(() => {
    const handleClickOutside = (event) => {
        if (calendarSelectedRef.current && !calendarSelectedRef.current.contains(event.target)) {
            setShowCalendarSelected(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);

// useEffect for outside click detection for job date calendar
useEffect(() => {
    const handleClickOutside = (event) => {
        if (calendarJobRef.current && !calendarJobRef.current.contains(event.target)) {
            setShowCalendarJob(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);

// useEffect for outside click detection for PO date calendar
useEffect(() => {
    const handleClickOutside = (event) => {
        if (calendarPORef.current && !calendarPORef.current.contains(event.target)) {
            setShowCalendarPO(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);

// useEffect for outside click detection for tender signed date calendar
useEffect(() => {
    const handleClickOutside = (event) => {
        if (calendarTenderRef.current && !calendarTenderRef.current.contains(event.target)) {
            setShowCalendarTender(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, []);

    useEffect(() => {

    if (quotation) {
        const newFields = {
            attention: quotation.attention || "",
            quotation_no: quotation.quotation_no || "",
            region: quotation.region || "",
            ref_qtn: quotation.ref_qtn || "",
            site: quotation.site || "",
            job_date: quotation.job_date ? String(quotation.job_date).slice(0, 10) : "",
            fam_no: quotation.fam_no || "",
            complain_nature: quotation.complain_nature || "",
            actual_break_down: quotation.actual_break_down || "",
            po_no: quotation.po_no || "",
            po_date: quotation.po_date ? String(quotation.po_date).slice(0, 10) : "",
            tender_no: quotation.tender_no || "",
            special_note: quotation.special_note || ""
        };
        const newSelectedDate = quotation.select_date ? String(quotation.select_date).slice(0, 10) : "";
        const newTenderSignedDate = quotation.signed_date ? String(quotation.signed_date).slice(0, 10) : "";
        const newVatValue = quotation.vat || 0;
        const newDiscountValue = quotation.discount || 0;

        setFields(newFields);
        setSelectedDate(newSelectedDate);
        setTenderSignedDate(newTenderSignedDate);
        setVatValue(newVatValue);
        setDiscountValue(newDiscountValue);

        // Store original values for cancel functionality
        setOriginalFields({...newFields});
        setOriginalSelectedDate(newSelectedDate);
        setOriginalTenderSignedDate(newTenderSignedDate);
        setOriginalVatValue(newVatValue);
        setOriginalDiscountValue(newDiscountValue);
    }
}, [quotation]);

    // Clear error when quotation data changes
    useEffect(() => {
        if (quotation || items.length > 0) {
            setError(null);
        }
    }, [quotation, items]);

    useEffect(() => {
    // Keep the initial validity check for jobCardId
    if (!jobCardId || jobCardId === 'undefined' || jobCardId === null) {
        console.log('Invalid jobCardId, skipping fetch');
        return;
    }

    const fetchQuotationData = async () => {
        setIsLoading(true);
    try {
        // 1. Attempt to fetch an EXISTING quotation first
        console.log('Attempting to fetch existing quotation data for jobCardId:', jobCardId);

        // Use your existing endpoint, which returns 404 if not found
        const response = await axios.get(`http://localhost:8000/api/quotations/${jobCardId}`, { withCredentials: true });
         
        // If the call succeeds, a quotation already exists.
        const data = response.data;
        console.log('Fetched existing quotation:', data);

        // Set the quotation state
        setQuotation(data);
        if (onQuotationCreated && data && data.id) {
            onQuotationCreated(data.id); 
        }

        // Safely set the items from the fetched data
        const safeItems = (data && data.items) ? data.items : [];
        const computedItems = safeItems.map(item => ({
            ...item,
            unitTotalPrice: item.unitPrice && item.quantity
                ? parseFloat(item.unitPrice) * parseFloat(item.quantity)
                : 0
        }));
        setItems(computedItems);
        // Store original items for cancel functionality
        setOriginalItems([...computedItems]);

        setIsLoading(false);
        
    } catch (error) {
        // 2. If the first call fails (e.g., a 404 Not Found),
        // it means no quotation exists yet.
        // Now, we fetch the JobCard's materials to initialize the form.
        console.log("No existing quotation found. Fetching Job Card materials.");
        
        try {
            // Use the NEW endpoint you created in the JobCardController
            const materialsResponse = await axios.get(`http://localhost:8000/api/job-cards/${jobCardId}/items`, { withCredentials: true });
            const materialsData = materialsResponse.data;
            
            console.log('Fetched Job Card materials:', materialsData);

            // FIX: Normalize the fetched data to match the expected format
            const normalizedItems = materialsData.map(item => ({
                id: item.id,
                // The '??' (nullish coalescing) operator checks if a value is null or undefined
                // This ensures we use the correct key regardless of the endpoint
                materialsNo: item.materialsNo ?? item.materials_no,
                description: item.description ?? item.materials,
                unitPrice: item.unitPrice ?? '', // Fallback to an empty string for the input field
                quantity: item.quantity,
                unitTotalPrice: 0 // Default to 0 for a new quotation total
            }));

            // Log the normalized data to confirm it looks correct
            console.log('Normalized Job Card materials:', normalizedItems);
            
            const finalItems = normalizedItems.length > 0 ? normalizedItems : [{
                materialsNo: "",
                description: "",
                unitPrice: "",
                quantity: "",
                unitTotalPrice: ""
            }];

            // Set the items state with the newly normalized array
            setItems(finalItems);
            // Store original items for cancel functionality
            setOriginalItems([...finalItems]);

            // IMPORTANT: Ensure other state variables are reset for a new quotation
            setQuotation(null); // Clear any old quotation data

            setIsLoading(false);
            
        } catch (materialsError) {
            console.error("Failed to fetch Job Card materials.", materialsError);
            const defaultItems = [{
                materialsNo: "",
                description: "",
                unitPrice: "",
                quantity: "",
                unitTotalPrice: ""
            }];
            setItems(defaultItems);
            setOriginalItems([...defaultItems]);
            setIsLoading(false);
        }
    }
};

    fetchQuotationData();
}, [jobCardId]); // Added proper dependency array


    // --- Handlers ---
    const handleFieldChange = (e) => {
        if (!isEditing) return;
        const { name, value } = e.target;
        setFields({ ...fields, [name]: value });
    };

    const handleItemChange = (index, field, value) => {
    if (!isEditing) return;
    
    setItems(prevItems => {
        const newItems = [...prevItems];
        newItems[index][field] = value;

        const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
        const quantity = parseFloat(newItems[index].quantity) || 0;
        newItems[index].unitTotalPrice = (unitPrice * quantity).toFixed(2);

        // Check if we need to add a new row (only for the last item)
        const isLastItem = index === newItems.length - 1;
        const hasContent = newItems[index].materialsNo !== "" || 
                          newItems[index].description !== "" || 
                          newItems[index].quantity !== "";

        if (isLastItem && hasContent) {
            // Add new empty row
            newItems.push({ 
                materialsNo: "", 
                description: "", 
                unitPrice: "", 
                quantity: "", 
                unitTotalPrice: "" 
            });
        }

        return newItems;
    });
};

    const handleDeleteRow = (index) => {
    if (!isEditing) {
        console.log('Cannot delete: not in editing mode');
        return;
    }
    
    console.log(`Attempting to delete row at index: ${index}, total items: ${items.length}`);
    
    if (items.length > 1 && index < items.length) {
        setItems(prevItems => {
            const newItems = prevItems.filter((_, i) => i !== index);
            console.log('Items after deletion:', newItems);
            return newItems;
        });
    } else {
        console.log('Cannot delete: either only one item left or invalid index');
    }
};

useEffect(() => {
    console.log('Items state changed:', items);
}, [items]);

    const handleVatChange = (e) => {
        if (!isEditing) return;
        setVatValue(e.target.value);
    };

    const handleDiscountChange = (e) => {
        if (!isEditing) return;
        setDiscountValue(e.target.value);
    };

    // --- Notification State ---
    const [notification, setNotification] = useState({ message: "", type: "" }); // type: 'success' or 'error'

    // Function to show notification
    const showNotification = (message, type) => {
        setNotification({ message, type });
        // The Notification component will handle its own hiding
    };

    // Function to clear notification
    const clearNotification = () => {
        setNotification({ message: "", type: "" });
    };

    const handleSubmit = async () => {
        console.log("handleSubmit function called."); 
    try {
        // ... (existing validation for items) ...

        // Ensure jobCardId is available
        if (!jobCardId || jobCardId === 'undefined' || jobCardId === null) {
            showNotification("Job Card ID is missing, cannot submit quotation.", "error");
            return;
        }

        const validItems = items.filter(item =>
            item &&
            (item.materialsNo?.trim() || item.description?.trim()) &&
            !isNaN(parseFloat(item.unitPrice)) && parseFloat(item.unitPrice) >= 0 &&
            !isNaN(parseFloat(item.quantity)) && parseFloat(item.quantity) >= 0
        );

        if (validItems.length === 0) {
            showNotification("No valid items to save - please add at least one item.", "error");
            return;
        }

        // The main payload to create/update the quotation record
        const payload = {
            job_card_id: jobCardId,
            select_date: selectedDate,
            signed_date: TenderSignedDate,
            ...fields,
            vat: vatValue,
            discount: discountValue,
            total_without_tax: parseFloat(calculateTotalWithoutTax()),
            total_with_tax: parseFloat(calculateTotalWithTax()),
            total_with_tax_vs_disc: parseFloat(calculateTotalWithTaxAndDiscount()),
        };

        // The items payload to update prices
        const itemsPayload = {
            items: validItems.map(item => ({
                id: item.id,
                description: item.description || "",
                unitPrice: parseFloat(item.unitPrice) || 0,
                quantity: parseFloat(item.quantity) || 0,
            }))
        };

        // THE FIX: Conditionally handle create vs. update
        if (quotation && quotation.id) {
            // SCENARIO A: QUOTATION ALREADY EXISTS
            // Update prices first
            const updateResponse = await axios.put(
                `http://localhost:8000/api/quotations/update-prices/${jobCardId}`,
                itemsPayload,
                { withCredentials: true }
            );

            // ... (Your existing code)

    if (updateResponse.status === 200) {
        // Correct logic: After successfully updating item prices, update the main quotation fields.
        // This requires the quotation's ID. You would need to get this ID from somewhere,
        // either the initial data fetch or from a previous response.

        const quotationId = quotation.id; // Replace with how you get the ID

        const updateMainResponse = await axios.put(
            `http://localhost:8000/api/quotations/${quotationId}`, // Use the correct PUT route
            payload,
            { withCredentials: true }
        );

        if (updateMainResponse.status === 200) {
            showNotification("Quotation updated successfully!", "success");
            setIsEditing(false);
            // Update original values after successful save
            setOriginalFields({...fields});
            setOriginalItems([...items]);
            setOriginalSelectedDate(selectedDate);
            setOriginalTenderSignedDate(TenderSignedDate);
            setOriginalVatValue(vatValue);
            setOriginalDiscountValue(discountValue);
        }
    }
// ...
        } else {
            // SCENARIO B: NO QUOTATION EXISTS
            // Create the main quotation record FIRST
            const createResponse = await axios.post('http://localhost:8000/api/quotations', payload, { withCredentials: true });

            if (createResponse.status === 201) { // New quotation created successfully
                showNotification("Quotation created successfully!", "success");

                const newQuotation = createResponse.data;
                console.log("Newly created quotation ID from API:", newQuotation.id);
                if (newQuotation && newQuotation.id) {
                    // Assuming the `onQuotationCreated` prop was passed from the parent
                    if (onQuotationCreated) {
                        onQuotationCreated(newQuotation.id);
                    }
                }

                // Then, update the prices using the newly created quotation's jobCardId
                const updateResponse = await axios.put(
                    `http://localhost:8000/api/quotations/update-prices/${jobCardId}`,
                    itemsPayload,
                    { withCredentials: true }
                );

                if (updateResponse.status === 200) {
                    showNotification("Prices updated successfully!", "success");
                    setIsEditing(false);
                    // Update original values after successful save
                    setOriginalFields({...fields});
                    setOriginalItems([...items]);
                    setOriginalSelectedDate(selectedDate);
                    setOriginalTenderSignedDate(TenderSignedDate);
                    setOriginalVatValue(vatValue);
                    setOriginalDiscountValue(discountValue);
                }
            }
        }

    } catch (error) {
        console.error('Error submitting quotation:', error.response ? error.response.data : error.message);
        const errorMessage = error.response && error.response.data && error.response.data.message
                               ? error.response.data.message
                               : "Error submitting quotation - please try again";
        showNotification(errorMessage, "error");

        if (error.response && error.response.data && error.response.data.errors) {
            console.error('Validation Errors:', error.response.data.errors);
        }
    }
};

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        // Restore original values
        setFields({...originalFields});
        setItems([...originalItems]);
        setSelectedDate(originalSelectedDate);
        setTenderSignedDate(originalTenderSignedDate);
        setVatValue(originalVatValue);
        setDiscountValue(originalDiscountValue);
        
        // Exit editing mode
        setIsEditing(false);
    };

    // Calculate totals
    const calculateTotalWithoutTax = () => {
        return items.reduce((total, item) => total + (parseFloat(item.unitTotalPrice) || 0), 0).toFixed(2);
    };

    const calculateVAT = () => {
        const totalWithoutTax = calculateTotalWithoutTax();
        return (parseFloat(totalWithoutTax) * (vatValue / 100)).toFixed(2);
    };

    const calculateTotalWithTax = () => {
        const totalWithoutTax = calculateTotalWithoutTax();
        const vat = calculateVAT();
        return (parseFloat(totalWithoutTax) + parseFloat(vat)).toFixed(2);
    };

    // Fix discount calculation to apply discount on totalWithoutTax instead of totalWithTax
    const calculateDiscount = () => {
        const totalWithoutTax = calculateTotalWithoutTax();
        return (parseFloat(totalWithoutTax) * (discountValue / 100)).toFixed(2);
    };

    const calculateTotalWithTaxAndDiscount = () => {
        const totalWithTax = calculateTotalWithTax();
        const discount = calculateDiscount();
        return (parseFloat(totalWithTax) - parseFloat(discount)).toFixed(2);
    };

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

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-LK', {
                style: 'currency',
                currency: 'LKR',
                minimumFractionDigits: 2
            }).format(amount);
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

            doc.text("This is a computer generated quotation and does not require signature.", margin, footerY);
            doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });

            // Terms
            doc.setFontSize(6);
            doc.text("Terms & Conditions: Valid for 30 days. Prices subject to change without notice.", margin, footerY + 10);
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

        // Initialize document
        let currentPage = 1;
        let totalPages = 1; // Will be updated later
        y = addPageHeader();

        // Document Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(41, 128, 185);
        doc.text("QUOTATION", pageWidth / 2, y, { align: "center" });
        y += 40;

        // Quotation Details Box
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(1);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 80, 'FD');

        // Quotation Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("QUOTATION DETAILS", margin + 10, y + 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const quotationDetails = [
            { label: "Quotation No:", value: fields.quotation_no || "AUTO-GENERATED" },
            { label: "Quotation Date:", value: formatDate(selectedDate) },
            { label: "Tender No:", value: fields.tender_no || "N/A" },
            { label: "Validity:", value: "30 Days" }
        ];

        let detailY = y + 35;
        quotationDetails.forEach((detail, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = margin + 10 + (col * 200);

            doc.setFont("helvetica", "bold");
            doc.text(detail.label, x, detailY + (row * 15));
            doc.setFont("helvetica", "normal");
            doc.text(detail.value, x + 80, detailY + (row * 15));
        });

        y += 100;

        // Quotation Information Section
        checkPageBreak(120);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.text("QUOTATION INFORMATION", margin, y);
        y += 20;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const quotationInfo = [
            ["Attention:", fields.attention || "N/A", "Region:", fields.region || "N/A"],
            ["Reference Quotation:", fields.ref_qtn || "N/A", "Site:", fields.site || "N/A"],
            ["Job Date:", formatDate(fields.job_date), "FAM No:", fields.fam_no || "N/A"],
            ["Complain Nature:", fields.complain_nature || "N/A", "PO No:", fields.po_no || "N/A"],
            ["PO Date:", formatDate(fields.po_date), "Signed Date:", formatDate(TenderSignedDate)]
        ];

        quotationInfo.forEach(row => {
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

        // Items Table
        checkPageBreak(150);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.text("ITEMS & MATERIALS", margin, y);
        y += 20;

        // Table Header
        const tableStartY = y;
        doc.setFillColor(41, 128, 185);
        doc.rect(margin, y - 5, contentWidth, 20, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);

        const columns = [
            { header: "No", width: 30, x: margin + 5 },
            { header: "Materials No", width: 80, x: margin + 35 },
            { header: "Description", width: 180, x: margin + 115 },
            { header: "Unit Price", width: 80, x: margin + 295 },
            { header: "Quantity", width: 60, x: margin + 375 },
            { header: "Total", width: 80, x: margin + 435 }
        ];

        columns.forEach(col => {
            doc.text(col.header, col.x, y + 8);
        });

        y += 25;
        doc.setTextColor(0, 0, 0);

        // Table Rows
        const validItems = items.filter(item =>
            item.materialsNo !== "" || item.description !== "" ||
            item.unitPrice !== "" || item.quantity !== ""
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
                item.materialsNo || "",
                item.description || "",
                item.unitPrice ? formatCurrency(parseFloat(item.unitPrice)) : "",
                item.quantity || "",
                item.unitTotalPrice ? formatCurrency(parseFloat(item.unitTotalPrice)) : ""
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

        // Summary Section
        checkPageBreak(120);

        // Summary Box
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(1);
        doc.setFillColor(241, 245, 249);
        doc.rect(pageWidth - margin - 200, y, 200, 100, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(41, 128, 185);
        doc.text("QUOTATION SUMMARY", pageWidth - margin - 190, y + 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const summaryItems = [
            { label: "Sub Total:", value: formatCurrency(calculateTotalWithoutTax()) },
            { label: "VAT Amount:", value: formatCurrency(calculateVAT()) },
            { label: "Discount Amount:", value: formatCurrency(calculateDiscount()) },
            { label: "Total Amount:", value: formatCurrency(calculateTotalWithTaxAndDiscount()), bold: true }
        ];

        let summaryY = y + 35;
        summaryItems.forEach(item => {
            if (item.bold) {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(41, 128, 185);
            }
            doc.text(item.label, pageWidth - margin - 190, summaryY);
            doc.text(item.value, pageWidth - margin - 80, summaryY, { align: "right" });
            if (item.bold) {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
            }
            summaryY += 15;
        });

        y += 120;

        // Special Notes
        if (fields.special_note) {
            checkPageBreak(60);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185);
            doc.text("SPECIAL NOTES", margin, y);
            y += 20;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            const splitNotes = doc.splitTextToSize(fields.special_note, contentWidth);
            doc.text(splitNotes, margin, y);
            y += splitNotes.length * 12 + 20;
        }

        // Authorization Section
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

        doc.text("Prepared By", margin + 50, y + 15, { align: "center" });
        doc.text("Approved By", margin + 275, y + 15, { align: "center" });
        doc.text("Accepted By", pageWidth - margin - 50, y + 15, { align: "center" });

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

    const handleDownload = () => {
        try {
            const doc = createPDFDocument();
            const fileName = `Quotation_${fields.quotation_no || 'new'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            console.log("PDF downloaded successfully");
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Error generating PDF. Please try again.");
        }
    };

    const handlePrint = () => {
        try {
            const doc = createPDFDocument();
            // Open PDF in new window for printing
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(pdfUrl, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            } else {
                alert("Please allow popups for this website to print the PDF.");
            }
            console.log("PDF opened for printing");
        } catch (error) {
            console.error("Error opening PDF for printing:", error);
            alert("Error opening PDF for printing. Please try again.");
        }
    };

    console.log("Rendering with items:", items);

    return (
        <div className={`w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl mt-4 sm:mt-6 md:mt-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-50 border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'}`}>
            {/* Notification Popup */}
            {notification.message && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={clearNotification}
                />
            )}

            {/* Header and Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} `}>
                    Quotation
                </h2>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                    {!isEditing ? (
                        // Show Edit button when not in editing mode
                        <button
                            onClick={handleEdit}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                        >
                            <FaEdit className="mr-2 text-xs sm:text-sm" />
                            <span className="text-xs sm:text-sm">Edit</span>
                        </button>
                    ) : (
                        // Show Cancel button when in editing mode
                        <button
                            onClick={handleCancel}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                        >
                            <FaTimes className="mr-2 text-xs sm:text-sm" />
                            <span className="text-xs sm:text-sm">Cancel</span>
                        </button>
                    )}
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

            {/* Quotation Details Section */}
            {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
                <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4 sm:mb-6 cursor-pointer" onClick={() => setIsQuotationInfoExpanded(!isQuotationInfoExpanded)}>
                    <h3 className={`text-xl sm:text-2xl font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"} flex items-center`}>
                    <FaInfoCircle className="mr-2 text-blue-400" /> Quotation Information
                    </h3>
                    {isQuotationInfoExpanded ? <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} /> : <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
                </div>

                {isQuotationInfoExpanded && (
                    <div className="space-y-6">
                        {/* First Row - Attention (full width) and Quotation No + Date */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Attention - Takes more space */}
                            <div className="lg:col-span-1">
                                <label htmlFor="attention" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Attention:</label>
                                <textarea
                                    id="attention"
                                    name="attention"
                                    value={fields.attention}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    rows="4"
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>

                            {/* Quotation No and Date in a column */}
                            <div className="space-y-4">
                                {/* Quotation No */}
                                <div>
                                    <label htmlFor="quotation_no" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quotation No:</label>
                                    <input
                                        type="text"
                                        id="quotation_no"
                                        name="quotation_no"
                                        value={fields.quotation_no}
                                        onChange={handleFieldChange}
                                        readOnly={!isEditing}
                                        className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                    />
                                </div>

                                {/* Date - Increased size */}
                                <div>
                                    <label className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date:</label>
                                    <div className="relative">
                                        <div
                                            className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border cursor-pointer select-none ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 transition-all duration-200 ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                            onClick={() => isEditing && setShowCalendarSelected(!showCalendarSelected)}
                                        >
                                            {selectedDate || 'Select Date'}
                                        </div>
                                        {showCalendarSelected && (
                                            <div ref={calendarSelectedRef} className="absolute z-10 mt-1 top-full left-0">
                                            <Calendar
                                                selectedDate={selectedDate ? new Date(selectedDate) : null}
                                                minDate={todayLocalStart}
                                                onDateSelect={(date) => {
                                                    setSelectedDate(formatLocalDate(date));
                                                    setShowCalendarSelected(false);
                                                }}
                                            />
                                            </div>
                                        )}
                                        <FaCalendarAlt className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Second Row - 3 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                                <label htmlFor="region" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Region:</label>
                                <input
                                    type="text"
                                    id="region"
                                    name="region"
                                    value={fields.region}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="ref_qtn" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ref Qtn:</label>
                                <input
                                    type="text"
                                    id="ref_qtn"
                                    name="ref_qtn"
                                    value={fields.ref_qtn}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="site" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Site:</label>
                                <input
                                    type="text"
                                    id="site"
                                    name="site"
                                    value={fields.site}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Third Row - Job Date and FAM NO */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div>
                                <label className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Job Date:</label>
                                <div className="relative">
                                    <div
                                        className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border cursor-pointer select-none ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 transition-all duration-200 ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                        onClick={() => isEditing && setShowCalendarJob(!showCalendarJob)}
                                    >
                                        {fields.job_date || 'Select Job Date'}
                                    </div>
                                    {showCalendarJob && (
                                        <div ref={calendarJobRef} className="absolute z-10 mt-1 top-full left-0">
                                            <Calendar
                                                selectedDate={fields.job_date ? new Date(fields.job_date) : null}
                                                minDate={todayLocalStart}
                                                onDateSelect={(date) => {
                                                    setFields(prev => ({...prev, job_date: formatLocalDate(date)}));
                                                    setShowCalendarJob(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                    <FaCalendarAlt className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="fam_no" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>FAM NO:</label>
                                <input
                                    type="text"
                                    id="fam_no"
                                    name="fam_no"
                                    value={fields.fam_no}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="complain_nature" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Complain Nature:</label>
                                <input
                                    type="text"
                                    id="complain_nature"
                                    name="complain_nature"
                                    value={fields.complain_nature}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Fourth Row - PO fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label htmlFor="po_no" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>PO NO:</label>
                                <input
                                    type="text"
                                    id="po_no"
                                    name="po_no"
                                    value={fields.po_no}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>PO Date:</label>
                                <div className="relative">
                                    <div
                                        className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border cursor-pointer select-none ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 transition-all duration-200 ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                        onClick={() => isEditing && setShowCalendarPO(!showCalendarPO)}
                                    >
                                        {fields.po_date || 'Select PO Date'}
                                    </div>
                                    {showCalendarPO && (
                                        <div ref={calendarPORef} className="absolute z-10 mt-1 top-full left-0">
                                            <Calendar
                                                selectedDate={fields.po_date ? new Date(fields.po_date) : null}
                                                minDate={todayLocalStart}
                                                onDateSelect={(date) => {
                                                    setFields(prev => ({...prev, po_date: formatLocalDate(date)}));
                                                    setShowCalendarPO(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                    <FaCalendarAlt className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </section>
            )}

            {/* Tender Information Section */}
            {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
                <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4 sm:mb-6 cursor-pointer" onClick={() => setIsTenderInfoExpanded(!isTenderInfoExpanded)}>
                        <h3
                        className={`text-xl sm:text-2xl font-semibold ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        } flex items-center`}
                        >
                        <FaInfoCircle className="mr-2 text-blue-400" /> Tender Information
                        </h3>
                        {isTenderInfoExpanded ? <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} /> : <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
                    </div>
                    {isTenderInfoExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label htmlFor="tender_no" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tender No:</label>
                                <input
                                    type="text"
                                    id="tender_no"
                                    name="tender_no"
                                    value={fields.tender_no}
                                    onChange={handleFieldChange}
                                    readOnly={!isEditing}
                                    className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Signed Date:</label>
                                <div className="relative">
                                    <div
                                        className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border cursor-pointer select-none ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 transition-all duration-200 ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                        onClick={() => isEditing && setShowCalendarTender(!showCalendarTender)}
                                    >
                                        {TenderSignedDate || 'Select Signed Date'}
                                    </div>
                                    {showCalendarTender && (
                                        <div ref={calendarTenderRef} className="absolute z-10 mt-1 top-full left-0">
                                            <Calendar
                                                selectedDate={TenderSignedDate ? new Date(TenderSignedDate) : null}
                                                minDate={todayLocalStart}
                                                onDateSelect={(date) => {
                                                    setTenderSignedDate(formatLocalDate(date));
                                                    setShowCalendarTender(false);
                                                }}
                                            />
                                        </div>
                                    )}
                                    <FaCalendarAlt className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Items Table */}
            <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4 sm:mb-6 cursor-pointer" onClick={() => setIsItemsTableExpanded(!isItemsTableExpanded)}>
                    <h3
                    className={`text-xl sm:text-2xl font-semibold ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                    } flex items-center`}
                    >
                        <FaInfoCircle className="mr-2 text-blue-400" /> Items/Materials Replaced
                    </h3>
                    {isItemsTableExpanded ? <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} /> : <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
                </div>
                {isItemsTableExpanded && (
                    <div className="overflow-x-auto">
                        <table className={`w-full text-left rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                            <thead className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-blue-100 text-blue-800'}`}>
                                <tr>
                                    <th className="p-2 sm:p-4 border-b-2 border-r-2 text-xs sm:text-sm md:text-base">Materials No</th>
                                    <th className="p-2 sm:p-4 border-b-2 border-r-2 text-xs sm:text-sm md:text-base">Description</th>
                                    <th className="p-2 sm:p-4 border-b-2 border-r-2 text-xs sm:text-sm md:text-base">Price /Rs:</th>
                                    <th className="p-2 sm:p-4 border-b-2 border-r-2 text-xs sm:text-sm md:text-base">Quantity</th>
                                    <th className="p-2 sm:p-4 border-b-2 rounded-tr-lg text-xs sm:text-sm md:text-base">Total /Rs:</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    //console.log("Rendering item:", item);
                                    <tr key={index} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50')}`}>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <input
                                                type="text"
                                                value={item.materialsNo}
                                                onChange={(e) => handleItemChange(index, "materialsNo", e.target.value)}
                                                readOnly={true} // Changed to always be true
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} cursor-not-allowed opacity-70`}
                                            />
                                        </td>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>

                                            <input
                                                type="text"
                                                value={item.description}
                                                readOnly={!isEditing}
                                                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                            />
                                        </td>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            {/* unitPrice (float values allowed) */}
                                            <input
                                                type="text"
                                                value={item.unitPrice}
                                                readOnly={!isEditing}
                                                onChange={(e) => {
                                                const value = e.target.value;
                                                // Allow valid float input: digits and at most one dot
                                                if (/^\d*\.?\d*$/.test(value)) {
                                                    handleItemChange(index, "unitPrice", value);
                                                }
                                                }}
                                                onBlur={() => {
                                                // Convert to float on blur
                                                const floatVal = parseFloat(item.unitPrice);
                                                handleItemChange(index, "unitPrice", isNaN(floatVal) ? '' : floatVal);
                                                }}
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${
                                                isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'
                                                } ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                            />
                                            </td>

                                            <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            {/* quantity (integer values only) */}
                                            <input
                                                type="text"
                                                value={item.quantity}
                                                readOnly={!isEditing}
                                                onChange={(e) => {
                                                const value = e.target.value;
                                                // Allow only digits (integers)
                                                if (/^\d*$/.test(value)) {
                                                    handleItemChange(index, "quantity", value);
                                                }
                                                }}
                                                onBlur={() => {
                                                // Convert to integer on blur
                                                const intVal = parseInt(item.quantity, 10);
                                                handleItemChange(index, "quantity", isNaN(intVal) ? '' : intVal);
                                                }}
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${
                                                isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                                                } ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                            />
                                            </td>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <input
                                                type="text"
                                                value={item.unitTotalPrice}
                                                readOnly={true} // Changed to always be true
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} cursor-not-allowed opacity-70`}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Totals and Summary Section */}
            {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
                <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4 sm:mb-6 cursor-pointer" onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
                        <h3
                        className={`text-xl sm:text-2xl font-semibold ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        } flex items-center`}
                        >
                        <FaInfoCircle className="mr-2 text-blue-400" /> Summary
                        </h3>
                        {isSummaryExpanded ? <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} /> : <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
                    </div>
                    {isSummaryExpanded && (
                        <div className="overflow-x-auto">
                            <table className={`w-full text-left rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                <tbody>
                                    <tr className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} w-3/4`}>
                                            <label className={`block text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total (Without TAX):</label>
                                        </td>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} w-1/4`}>
                                            <input
                                                type="text"
                                                value={calculateTotalWithoutTax()}
                                                readOnly
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} cursor-not-allowed opacity-70`}
                                            />
                                        </td>
                                    </tr>
                                    <tr className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'}`}>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                                <label htmlFor="vatValue" className={`block text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>VAT (%):</label>
                                                <input
                                                    type="number"
                                                    id="vatValue"
                                                    min="0"
                                                    value={vatValue}
                                                    onChange={handleVatChange}
                                                    readOnly={!isEditing}
                                                    className={`flex-grow px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                                />
                                            </div>
                                        </td>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <input
                                                type="text"
                                                value={calculateVAT()}
                                                readOnly
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} cursor-not-allowed opacity-70`}
                                            />
                                        </td>
                                    </tr>
                                    <tr className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <label className={`block text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total (With TAX):</label>
                                        </td>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <input
                                                type="text"
                                                value={calculateTotalWithTax()}
                                                readOnly
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} cursor-not-allowed opacity-70`}
                                            />
                                        </td>
                                    </tr>
                                    <tr className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'}`}>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                                <label htmlFor="discountValue" className={`block text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Discount (%):</label>
                                                <input
                                                    type="number"
                                                    id="discountValue"
                                                    min="0"
                                                    value={discountValue}
                                                    onChange={handleDiscountChange}
                                                    readOnly={!isEditing}
                                                    className={`flex-grow px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                                                />
                                            </div>
                                        </td>
                                        <td className={`p-2 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <input
                                                type="text"
                                                value={calculateDiscount()}
                                                readOnly
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} cursor-not-allowed opacity-70`}
                                            />
                                        </td>
                                    </tr>
                                    <tr className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <td className={`p-2 sm:p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <label className={`block text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total (With TAX & Discount):</label>
                                        </td>
                                        <td className={`p-2 sm:p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <input
                                                type="text"
                                                value={calculateTotalWithTaxAndDiscount()}
                                                readOnly
                                                className={`w-full px-2 py-1 sm:px-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'} cursor-not-allowed opacity-70`}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* Special Note Section */}
            {(userRole === 'Administrator' || userRole === 'Tecnical_Head') && (
                <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4 sm:mb-6 cursor-pointer" onClick={() => setIsSpecialNoteExpanded(!isSpecialNoteExpanded)}>
                        <h3
                        className={`text-xl sm:text-2xl font-semibold ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        } flex items-center`}
                        >
                        <FaInfoCircle className="mr-2 text-blue-400" /> Additional Notes
                        </h3>
                        {isSpecialNoteExpanded ? <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} /> : <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
                    </div>
                    {isSpecialNoteExpanded && (
                        <div>
                            <label htmlFor="special_note" className={`block text-sm sm:text-base font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Special Note:</label>
                            <textarea
                                id="special_note"
                                name="special_note"
                                value={fields.special_note}
                                onChange={handleFieldChange}
                                readOnly={!isEditing}
                                rows="4"
                                className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            />
                        </div>
                    )}
                </section>
            )}

            {/* Submit Button */}
            <div className="flex justify-end mt-6 sm:mt-8">
                {isJobCancelled ? (
                    <div className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg transition-all duration-300 flex items-center ${isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}>
                        <FaInfoCircle className="mr-2 sm:mr-3 text-base sm:text-lg" />
                        <span className="text-sm sm:text-base">Quotation Submission Disabled</span>
                    </div>
                ) : (
                    isEditing && (
                        <button
                            onClick={handleSubmit}
                            className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            <FaCheck className="mr-2 sm:mr-3 text-base sm:text-lg" />
                            <span className="text-sm sm:text-base">Submit Quotation</span>
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

export default Quotation;