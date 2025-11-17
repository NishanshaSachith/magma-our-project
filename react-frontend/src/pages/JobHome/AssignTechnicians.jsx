import React, { useState, useEffect, useContext } from "react";
import { FaTrash } from "react-icons/fa";
import api from "../../services/api";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import Notification from "../../components/Notification/Notification";

const AssignTechnicians = ({ jobHomeId, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const [technicians, setTechnicians] = useState([]);
  const [assignedTechnicians, setAssignedTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchTechnicians();
    fetchAssignedTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const res = await api.get("/technicians");
      setTechnicians(res.data);
    } catch (err) {
      console.error("Failed to fetch technicians", err.response?.data || err.message);
    }
  };

  const fetchAssignedTechnicians = async () => {
    try {
      const res = await api.get(`/jobhomes/${jobHomeId}/technicians`);
      setAssignedTechnicians(res.data);
    } catch (err) {
      console.error("Failed to fetch assigned technicians", err.response?.data || err.message);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnician) {
      setNotification({ message: "Please select a technician to assign.", type: "error" });
      return;
    }

    const tech = technicians.find((t) => t.id === parseInt(selectedTechnician));
    if (!tech) {
      setNotification({ message: "Selected technician not found.", type: "error" });
      return;
    }

    const payload = {
      technicians: [
        {
          user_id: tech.id,
          technician_name: tech.fullname,
          assign_date: new Date().toISOString().split("T")[0],
        },
      ],
    };

    try {
      const res = await api.post(`/jobhomes/${jobHomeId}/technicians`, payload);
      setNotification({ message: res.data.message || "Technician assigned successfully", type: "success" });
      setSelectedTechnician("");
      fetchAssignedTechnicians();
    } catch (err) {
      console.error("Failed to assign technician", err.response?.data || err.message);
      setNotification({ message: `Failed to assign technician: ${err.response?.data?.message || err.message}`, type: "error" });
    }
  };

  const handleDelete = async (technicianId) => {
    setTechnicianToDelete(technicianId);
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await api.delete(`/jobhomes/${jobHomeId}/technicians/${technicianToDelete}`);
      setNotification({ message: res.data.message || "Technician assignment deleted successfully", type: "success" });
      setConfirmVisible(false);
      setTechnicianToDelete(null);
      fetchAssignedTechnicians();
    } catch (err) {
      console.error("Failed to delete technician assignment", err.response?.data || err.message);
      setNotification({ message: `Failed to delete technician assignment: ${err.response?.data?.message || err.message}`, type: "error" });
      setConfirmVisible(false);
      setTechnicianToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmVisible(false);
    setTechnicianToDelete(null);
  };

  const clearNotification = () => {
    setNotification({ message: '', type: 'success' });
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      } p-6 rounded-lg max-w-3xl mx-auto mt-6`}
    >
      <h2 className="text-2xl font-bold mb-4">Assign Technician</h2>

      {/* Select Technician */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Select Technician:</label>
        <select
          value={selectedTechnician}
          onChange={(e) => setSelectedTechnician(e.target.value)}
          className={`w-full p-2 border rounded ${
            isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
          }`}
        >
          <option value="">-- Select Technician -- ({technicians.length} available)</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.fullname}
            </option>
          ))}
        </select>
      </div>

      {/* Assign Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAssign}
          className="w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 px-6 rounded-lg sm:rounded-xl font-semibold transition-colors duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Assign Technician
        </button>
      </div>

      {/* Assigned Technicians List */}
      <h3 className="mt-8 text-xl font-semibold">Assigned Technicians</h3>
      <ul className="mt-4 space-y-2">
        {assignedTechnicians.length === 0 && <li>No technicians assigned yet.</li>}
        {assignedTechnicians.map((tech) => (
          <li key={tech.id} className="flex justify-between items-center border-b pb-2">
            <span className="flex-1">{tech.technician_name}</span>
            <div className="flex items-center space-x-4 min-w-0">
              <span className="whitespace-nowrap">{tech.assign_date}</span>
              <button
                onClick={() => handleDelete(tech.id)}
                className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-lg font-semibold transition-colors duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                title="Delete technician assignment"
              >
                <FaTrash />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Close Button */}
      {/* <div className="flex justify-end">
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white transition"
        >
          Close
        </button>
      </div> */}

      <ConfirmationModal
        show={confirmVisible}
        title="Confirm Delete"
        message="Are you sure you want to delete this technician assignment? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDarkMode={isDarkMode}
      />

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={clearNotification}
      />
    </div>
  );
};

export default AssignTechnicians;
