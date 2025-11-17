import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

const AssignTechnician = ({ jobHomeId, onClose }) => {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [assignDate, setAssignDate] = useState('');

  useEffect(() => {
    axios.get('/api/technicians')
      .then(res => {
        // Map the response data to match the expected format for react-select
        const technicianOptions = res.data.map(tech => ({
          value: tech.id,
          label: tech.fullname || tech.username || `Technician ${tech.id}`
        }));
        setTechnicians(technicianOptions);
      })
      .catch(err => {
        console.error('Error fetching technicians:', err);
        alert("Failed to load technicians");
      });
  }, []);

  const handleAssign = () => {
    // Validate that at least one technician is selected
    if (selectedTechnicians.length === 0) {
      alert("Please select at least one technician");
      return;
    }

    // Validate that assign date is provided
    if (!assignDate) {
      alert("Please select an assign date");
      return;
    }

    const payload = {
      technicians: selectedTechnicians.map(tech => ({
        user_id: tech.value,
        technician_name: tech.label,
        assign_date: assignDate,
      })),
    };

    axios.post(`/api/job-home-technicians/${jobHomeId}`, payload)
      .then(res => {
        alert("Technicians assigned successfully");
        onClose(); // Close the modal after successful assignment
      })
      .catch(err => {
        console.error('Error assigning technicians:', err);
        alert("Failed to assign technicians: " + (err.response?.data?.message || err.message));
      });
  };

  // Handle modal close on Escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Assign Technicians</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <Select
          isMulti
          options={technicians}
          onChange={setSelectedTechnicians}
          placeholder="Select technicians"
          className="mb-4"
        />

        <input
          type="date"
          value={assignDate}
          onChange={e => setAssignDate(e.target.value)}
          className="mb-4 border p-2 w-full"
          placeholder="Assign Date"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleAssign} className="px-4 py-2 bg-blue-600 text-white rounded">Assign</button>
        </div>
      </div>
    </div>
  );
};

export default AssignTechnician;
