import { useState, useContext, useEffect, useRef } from "react";
import {
  FaCalendarAlt,
  FaTrash,
  FaEdit,
  FaCheck,
  FaFileInvoiceDollar,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaDownload,
  FaPrint,
  FaTimes
} from "react-icons/fa";
import { ThemeContext } from "../../ThemeContext/ThemeContext";
import Notification from '../../Notification/Notification';
import { useAuth } from "../../../pages/hooks/useAuth";
import jsPDF from "jspdf";
import Calendar from '../../Calender/Calender';

const TaxInvoice = ({ quotationId: propQuotationId, jobNo, isJobCancelled = false }) => {
  const { isDarkMode } = useContext(ThemeContext);

  // Fix initial invoiceDate to use local date string to avoid timezone issues
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [tenderSignedDate, setTenderSignedDate] = useState("2025-06-10");
  const [items, setItems] = useState([
    { materialsNo: "", description: "", unitPrice: "", quantity: "", unitTotalPrice: "" },
  ]);
  const [vatValue, setVatValue] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);

  // Invoice-specific fillable fields
  const [invoiceFields, setInvoiceFields] = useState({
    invoiceNo: null,
    vatNo: "",
    specialNote: "",
  });

  // Editing state for Invoice Information
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [originalInvoiceFields, setOriginalInvoiceFields] = useState({});

  // Quotation data fields (read-only)
  const [quotationFields, setQuotationFields] = useState({
    attention: "",
    region: "",
    refQtn: "",
    site: "",
    jobDate: "",
    famNo: "",
    complainNature: "",
    poNo: "",
    poDate: "",
  });

  // Notification state
  const [notification, setNotification] = useState({ message: "", type: "" });

  // API and loading states
  const [quotationId, setQuotationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingInvoice, setExistingInvoice] = useState(null);

  // Section expansion states
  const [isInvoiceInfoExpanded, setIsInvoiceInfoExpanded] = useState(true);
  const [isQuotationInfoExpanded, setIsQuotationInfoExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const [calendarHeight, setCalendarHeight] = useState(400); // Default height estimate

  // Fix selectedDate prop to Calendar to avoid timezone issues
  const selectedDateObj = invoiceDate ? new Date(invoiceDate + 'T00:00:00') : null;
  const todayLocalStart = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

  // Measure calendar height when it renders
  useEffect(() => {
    if (showCalendar && calendarContainerRef.current) {
      const rect = calendarContainerRef.current.getBoundingClientRect();
      setCalendarHeight(rect.height);
    }
  }, [showCalendar]);

  useEffect(() => {
    if (!showCalendar) return;

    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    }

    function handleScroll() {
      setShowCalendar(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showCalendar]);


  // Helper function to format dates as DD/MM/YYYY
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Styling helpers
  const inputStyle = (isReadOnly) => `
    w-full border rounded-xl px-4 py-2.5 transition-all duration-200
    focus:ring-4 focus:ring-blue-300
    ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'}
    ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}
  `;

  const labelStyle = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  const buttonStyle = `
    px-8 py-3 rounded-xl shadow-lg transition-all duration-300
    flex items-center transform hover:scale-105
  `;

  const actionButtonColors = {
    submit: `${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`,
    edit: `${isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`,
  };

  // Handlers for invoice fields (fillable)
  const handleInvoiceFieldChange = (e) => {
    const { name, value } = e.target;
    setInvoiceFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Invoice editing handlers
  const handleStartEditingInvoice = () => {
    setOriginalInvoiceFields({ ...invoiceFields });
    setIsEditingInvoice(true);
  };

  const handleCancelEditingInvoice = () => {
    setInvoiceFields({ ...originalInvoiceFields });
    setIsEditingInvoice(false);
  };

  const handleSaveInvoiceChanges = async () => {
    if (!quotationId) {
      setNotification({ message: "Please load a quotation first", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        quotation_id: quotationId,
        invoice_no: invoiceFields.invoiceNo,
        vat_no: invoiceFields.vatNo,
        invoice_date: invoiceDate,
        notes: invoiceFields.specialNote,
      };

      const response = await fetch(`http://localhost:8000/api/invoices/update-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice information');
      }

      await response.json();
      setIsEditingInvoice(false);
      setNotification({ message: "Invoice information updated successfully!", type: "success" });
    } catch (err) {
      setError(err.message);
      setNotification({ message: "Failed to update invoice information", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Items handlers: allow editing unitPrice and quantity only
  const handleItemChange = (index, field, value) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        let updatedItem = { ...item, [field]: value };
        if (field === "unitPrice" || field === "quantity") {
          const unitPrice = parseFloat(field === "unitPrice" ? value : item.unitPrice) || 0;
          const quantity = parseFloat(field === "quantity" ? value : item.quantity) || 0;
          updatedItem.unitTotalPrice = (unitPrice * quantity).toFixed(2);
        }
        return updatedItem;
      }
      return item;
    });

    // Add new empty row if last row is being filled
    const lastItem = newItems[newItems.length - 1];
    if (
      newItems.length === 0 ||
      (lastItem.materialsNo || lastItem.description || lastItem.unitPrice || lastItem.quantity)
    ) {
      newItems.push({ materialsNo: "", description: "", unitPrice: "", quantity: "", unitTotalPrice: "" });
    }

    setItems(newItems);
  };

  const handleDeleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length > 0 ? newItems : [{ materialsNo: "", description: "", unitPrice: "", quantity: "", unitTotalPrice: "" }]);
  };

  // Calculate totals
  const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.unitTotalPrice) || 0), 0);
  const vatAmount = subTotal * (vatValue / 100);
  const discountAmount = subTotal * (discountValue / 100);
  const totalAmount = subTotal + vatAmount - discountAmount;

  // Fetch quotation and invoice data
  const fetchQuotation = async () => {
    if (!quotationId) {
      setError("Please enter a quotation ID");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8000/api/quotations/by-id/${quotationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Failed to fetch quotation';
        throw new Error(errorMessage);
      }
      const data = await response.json();

      // Populate quotation fields (read-only)
      setQuotationFields({
        attention: data.attention || "",
        region: data.region || "",
        refQtn: data.ref_qtn || "",
        site: data.site || "",
        jobDate: data.job_date ? data.job_date.slice(0, 10) : "",
        famNo: data.fam_no || "",
        complainNature: data.complain_nature || "",
        poNo: data.po_no || "",
        poDate: data.po_date ? data.po_date.slice(0, 10) : "",
      });

      // Populate VAT and Discount from quotation
      setVatValue(data.vat || 0);
      setDiscountValue(data.discount || 0);

      // Populate invoice fields (fillable) from quotation where applicable
      setInvoiceFields((prev) => ({
        ...prev,
        invoiceNo: data.quotation_no || prev.invoiceNo,
      }));

      // Populate items from quotation items (read-only materialsNo and description)
      if (data.items) {
        setItems(data.items.map(item => ({
          materialsNo: item.materials_no || item.materialsNo || "",
          description: item.description || "",
          unitPrice: item.unitPrice || "",
          quantity: item.quantity || "",
          unitTotalPrice: (parseFloat(item.unitPrice || 0) * parseFloat(item.quantity || 0)).toFixed(2),
        })));
      }

      // Check for existing invoice
      const invoiceResponse = await fetch(`http://localhost:8000/api/invoices/by-quotation/${quotationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        if (invoiceData) {
          setExistingInvoice(invoiceData);
          setInvoiceFields(prev => ({
            ...prev,
            invoiceNo: invoiceData.invoice_no || prev.invoiceNo,
            vatNo: invoiceData.vat_no || prev.vatNo,
            specialNote: invoiceData.notes || prev.specialNote,
          }));
          setInvoiceDate(invoiceData.invoice_date ? invoiceData.invoice_date.slice(0, 10) : (() => {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
          })());
        }
      }

      setLoading(false);
      setNotification({ message: "Quotation loaded successfully!", type: "success" });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setNotification({ message: err.message || "Failed to load quotation", type: "error" });
    }
  };

  // Sync internal quotationId with prop
  useEffect(() => {
    if (propQuotationId && propQuotationId !== quotationId) {
      setQuotationId(propQuotationId);
    }
  }, [propQuotationId]);

  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId]);

  // Submit invoice handler
  const handleSubmit = async () => {
    if (!quotationId) {
      setError("Please load a quotation first");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const invoiceData = {
        quotation_id: quotationId,
        invoice_no: invoiceFields.invoiceNo,
        vat_no: invoiceFields.vatNo,
        invoice_date: invoiceDate,
        total_amount: totalAmount,
        notes: invoiceFields.specialNote,
      };

      let response;
      if (existingInvoice && existingInvoice.id) {
        // Update existing invoice
        response = await fetch(`http://localhost:8000/api/invoices/${existingInvoice.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });
        setNotification({ message: "Invoice updated successfully!", type: "success" });
      } else {
        // Create new invoice
        response = await fetch('http://localhost:8000/api/invoices', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });
        setNotification({ message: "Invoice created successfully!", type: "success" });
      }

      if (!response.ok) {
        throw new Error(existingInvoice ? 'Failed to update invoice' : 'Failed to create invoice');
      }
      await response.json();
    } catch (err) {
      setError(err.message);
      setNotification({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Professional PDF Generation Logic
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

      doc.text("This is a computer generated invoice and does not require signature.", margin, footerY);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });

      // Terms
      doc.setFontSize(6);
      doc.text("Terms & Conditions: Payment due within 30 days. Late payments may incur additional charges.", margin, footerY + 10);
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
    doc.text("TAX INVOICE", pageWidth / 2, y, { align: "center" });
    y += 40;

    // Invoice Details Box
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 80, 'FD');

    // Invoice Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE DETAILS", margin + 10, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const invoiceDetails = [
      { label: "Invoice No:", value: invoiceFields.invoiceNo || "AUTO-GENERATED" },
      { label: "Invoice Date:", value: formatDate(invoiceDate) },
      { label: "VAT No:", value: invoiceFields.vatNo || "N/A" },
      { label: "Payment Terms:", value: "30 Days" }
    ];

    let detailY = y + 35;
    invoiceDetails.forEach((detail, index) => {
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
      ["Attention:", quotationFields.attention || "N/A", "Region:", quotationFields.region || "N/A"],
      ["Reference Quotation:", quotationFields.refQtn || "N/A", "Site:", quotationFields.site || "N/A"],
      ["Job Date:", formatDate(quotationFields.jobDate), "FAM No:", quotationFields.famNo || "N/A"],
      ["Complain Nature:", quotationFields.complainNature || "N/A", "PO No:", quotationFields.poNo || "N/A"],
      ["PO Date:", formatDate(quotationFields.poDate), "", ""]
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
    doc.text("INVOICE SUMMARY", pageWidth - margin - 190, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const summaryItems = [
      { label: "Sub Total:", value: formatCurrency(subTotal) },
      { label: "VAT Amount:", value: formatCurrency(vatAmount) },
      { label: "Discount Amount:", value: formatCurrency(discountAmount) },
      { label: "Total Amount:", value: formatCurrency(totalAmount), bold: true }
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
    if (invoiceFields.specialNote) {
      checkPageBreak(60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.text("SPECIAL NOTES", margin, y);
      y += 20;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const splitNotes = doc.splitTextToSize(invoiceFields.specialNote, contentWidth);
      doc.text(splitNotes, margin, y);
      y += splitNotes.length * 12 + 20;
    }

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

    doc.text("Prepared By", margin + 50, y + 15, { align: "center" });
    doc.text("Approved By", margin + 275, y + 15, { align: "center" });
    doc.text("Received By", pageWidth - margin - 50, y + 15, { align: "center" });

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

  const generatePDF = () => {
    return createPDFDocument();
  };

  const savePDF = () => {
    const doc = createPDFDocument();
    doc.save(`invoice_${jobNo || invoiceFields.invoiceNo || 'new'}_${new Date().toISOString().split('T')[0]}.pdf`);
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




  return (
    <div className={`invoice-content w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl mt-4 sm:mt-6 md:mt-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-50 border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'}`}>
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
      )}

      {/* Header and actions */}
      <div className="flex flex-row justify-between items-center gap-4 w-full mb-6 sm:mb-8">
          <h2 className={`flex-1 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            Tax Invoice
          </h2>
      <div className="flex flex-wrap gap-2 sm:gap-4 flex-shrink-0">
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
      </div>
        </div>

      {/* Quotation Information (ID Card Format) */}
      <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div
          className={`flex justify-between items-center mb-4 sm:mb-6 cursor-pointer ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
          onClick={() => {
            const newState = !isQuotationInfoExpanded;
            setIsQuotationInfoExpanded(newState);
            setIsItemsExpanded(newState);
            setIsSummaryExpanded(newState);
          }}
        >
          <h3 className={`text-xl sm:text-2xl font-semibold flex items-center`}>
            <FaInfoCircle className="mr-2 text-blue-400" /> Quotation Information
          </h3>
          {isQuotationInfoExpanded ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>

        {/* ID Card Style Layout */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isQuotationInfoExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`} style={{ maxHeight: isQuotationInfoExpanded ? '1000px' : '0' }}>
          <div className={`rounded-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-lg overflow-hidden`}>
            {/* Card Header */}
            <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-600' : 'bg-blue-50'} border-b ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-blue-900'}`}>Quotation Details</h4>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Object.entries(quotationFields).map(([key, value]) => (
                  <div key={key} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                    <label className={`block text-xs font-medium mb-1 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </label>
                    <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
{(key === 'jobDate' || key === 'poDate') && value ? formatDateDisplay(value) : (key === 'invoiceDate' && value ? value : (value || "-----------------------------------------"))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
        <br></br>
        <div
          className={`flex justify-between items-center mb-4 sm:mb-6 cursor-pointer ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
          onClick={() => setIsItemsExpanded(!isItemsExpanded)}
        >
          <h3 className={`text-xl sm:text-2xl font-semibold flex items-center`}>
            <FaCheck className="mr-2 text-blue-400" /> Items/Materials
          </h3>
          {isItemsExpanded ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        
        {/* Items/Materials (ID Card Format) */}
        {/* Items Card Layout */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isItemsExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`} style={{ maxHeight: isItemsExpanded ? '2000px' : '0' }}>
          <div className={`rounded-lg border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-lg overflow-hidden`}>
            {/* Card Header */}
            <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-600' : 'bg-blue-50'} border-b ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-blue-900'}`}>Materials & Pricing</h4>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className={`min-w-full table-auto border-collapse ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  <thead>
                    <tr className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Materials No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Unit Price /Rs:</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Total /Rs:</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className={`${isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-white hover:bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} transition-colors duration-200`}>
                        <td className="px-4 py-3 text-sm font-medium">{item.materialsNo || "N/A"}</td>
                        <td className="px-4 py-3 text-sm">{item.description || "N/A"}</td>
                        <td className="px-4 py-3 text-sm">{item.unitPrice || "N/A"}</td>
                        <td className="px-4 py-3 text-sm">{item.quantity || "N/A"}</td>
                        <td className="px-4 py-3 text-sm font-semibold">Rs. {item.unitTotalPrice || "0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <br></br>
        <div
          className={`flex justify-between items-center mb-4 sm:mb-6 cursor-pointer ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
        >
          <h3 className={`text-xl sm:text-2xl font-semibold flex items-center`}>
            <FaInfoCircle className="mr-2 text-blue-400" /> Summary
          </h3>
          {isSummaryExpanded ? (
            <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          ) : (
            <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        
      {/* Summary (ID Card Format) */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSummaryExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`} style={{ maxHeight: isSummaryExpanded ? '1000px' : '0' }}>
        <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>


          {/* Summary Card Layout */}


            {/* Card Header */}
            <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-600' : 'bg-blue-50'} border-b ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-blue-900'}`}>Invoice Summary</h4>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Sub Total */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Sub Total:
                  </label>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Rs. {subTotal.toFixed(2)}
                  </div>
                </div>

                {/* VAT Percentage (Editable) */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    VAT (%):
                  </label>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {vatAmount.toFixed(2)} %
                  </div>
                </div>

                {/* VAT Amount */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    VAT Amount:
                  </label>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Rs. {vatAmount.toFixed(2)}
                  </div>
                </div>

                {/* Discount Percentage (Editable) */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Discount (%):
                  </label>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Rs. {discountAmount.toFixed(2)}
                  </div>
                </div>

                {/* Discount Amount */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
                  <label className={`block text-xs font-medium mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Discount Amount:
                  </label>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Rs. {discountAmount.toFixed(2)}
                  </div>
                </div>

                {/* Total Amount */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-700' : 'bg-green-50'} border ${isDarkMode ? 'border-green-600' : 'border-green-300'}`}>
                  <label className={`block text-xs font-medium mb-2 uppercase tracking-wide ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                    Total Amount:
                  </label>
                  <div className={`text-xl font-bold ${isDarkMode ? 'text-green-100' : 'text-green-900'}`}>
                    Rs. {totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
        </section>
      </div>

      </section>

      {/* Invoice Information (fillable) */}
      <section className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4 sm:mb-6 cursor-pointer" onClick={() => setIsInvoiceInfoExpanded(!isInvoiceInfoExpanded)}>
          <h3 className={`text-xl sm:text-2xl font-semibold flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <FaFileInvoiceDollar className="mr-2 text-blue-400" /> Invoice Information
          </h3>
          <div className="flex items-center gap-2">
            {!isEditingInvoice ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleStartEditingInvoice(); }}
                className={`px-4 py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${actionButtonColors.edit}`}
              >
                <FaEdit className="mr-2 text-sm" />
                <span className="text-sm">Edit</span>
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handleCancelEditingInvoice(); }}
                className={`px-4 py-2 rounded-lg shadow-md transition-all duration-300 flex items-center transform hover:scale-105 ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                <FaTimes className="mr-2 text-xs sm:text-sm" />
                <span className="text-sm">Cancel</span>
              </button>
            )}
            {isInvoiceInfoExpanded ? (
              <FaChevronUp className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            ) : (
              <FaChevronDown className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            )}
          </div>
        </div>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isInvoiceInfoExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`} style={{ maxHeight: isInvoiceInfoExpanded ? '400px' : '0' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className={labelStyle}>Invoice No:</label>
              <input
                type="text"
                name="invoiceNo"
                value={invoiceFields.invoiceNo || ""}
                onChange={handleInvoiceFieldChange}
                className={inputStyle(!isEditingInvoice)}
                readOnly={!isEditingInvoice}
                placeholder="Enter Invoice No"
              />
            </div>
            <div>
              <label className={labelStyle}>VAT No:</label>
              <input
                type="text"
                name="vatNo"
                value={invoiceFields.vatNo}
                onChange={handleInvoiceFieldChange}
                className={inputStyle(!isEditingInvoice)}
                readOnly={!isEditingInvoice}
              />
            </div>
            <div className="relative">
  <label className={labelStyle}>Invoice Date:</label>
      
          {isEditingInvoice ? (
            <div className="relative">
              <div
                className={`border rounded-xl px-4 py-2 pr-12 cursor-pointer select-none relative ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border border-gray-300'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;
                  const spaceAbove = rect.top;
                  const buffer = 10; // Buffer space from viewport edges
                  const effectiveHeight = calendarHeight + buffer;
                  let top;
                  if (spaceBelow >= effectiveHeight) {
                    // Position below the input
                    top = rect.bottom + window.scrollY + buffer;
                  } else if (spaceAbove >= effectiveHeight) {
                    // Position above the input
                    top = rect.top - calendarHeight + window.scrollY - buffer;
                  } else {
                    // Position below and adjust if needed
                    top = Math.max(buffer, rect.bottom + window.scrollY - (effectiveHeight - spaceBelow));
                  }
                  setCalendarPosition({ top, left: rect.left + window.scrollX });
                  setShowCalendar(!showCalendar);
                }}
              >
                {invoiceDate}
                <FaCalendarAlt className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
                  {showCalendar && (
                    <div
                      ref={calendarRef}
                      style={{
                        position: 'fixed',
                        top: calendarPosition.top,
                        left: calendarPosition.left,
                        zIndex: 9999,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        backgroundColor: isDarkMode ? '#374151' : '#fff',
                        borderRadius: '0.75rem',
                      }}
                    >
                      <Calendar
                          selectedDate={selectedDateObj}
                          minDate={todayLocalStart}
                          onDateSelect={(date) => {
                              // Fix timezone issue by using local date components
                              const year = date.getFullYear();
                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
                              const day = date.getDate().toString().padStart(2, '0');
                              setInvoiceDate(`${year}-${month}-${day}`);
                              setShowCalendar(false);
                          }}
                      />
                    </div>
                  )}
            </div>
          ) : (
            <div className="relative">
              <div className={`${inputStyle(true)} pr-12 flex items-center`}>
                {invoiceDate}
              </div>
              <FaCalendarAlt className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          )}
        </div>
            <div>
              <label className={labelStyle}>Special Note:</label>
              <textarea
                name="specialNote"
                value={invoiceFields.specialNote}
                onChange={handleInvoiceFieldChange}
                rows="4"
                className={`w-full border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-200 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border-gray-300'} ${!isEditingInvoice ? 'cursor-not-allowed opacity-70' : ''}`}
                readOnly={!isEditingInvoice}
              />
            </div>
          </div>
        </div>
      </section>

      

      {/* Submit Button */}
      <div className="flex justify-end mt-6 sm:mt-8">
        {isJobCancelled ? (
          <div className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg transition-all duration-300 flex items-center ${isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`}>
            <FaInfoCircle className="mr-2 sm:mr-3 text-base sm:text-lg" />
            <span className="text-sm sm:text-base">Invoice Submission Disabled</span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg transition-all duration-300 flex items-center transform hover:scale-105 ${actionButtonColors.submit}`}
          >
            <FaCheck className="mr-2 sm:mr-3 text-base sm:text-lg" />
            <span className="text-sm sm:text-base">Submit Invoice</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaxInvoice;
