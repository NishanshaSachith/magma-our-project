import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { ThemeContext } from '../../components/ThemeContext/ThemeContext';
import { FaPaperPlane, FaUser } from 'react-icons/fa';
import Notification from '../../components/Notification/Notification';

const Message = ({ jobHomeId, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personType, setPersonType] = useState('customer'); // 'customer' or 'contact_person'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchPerson();
  }, [personType, jobHomeId]);

  const fetchPerson = async () => {
    try {
      const response = await api.get('/persons', {
        params: { type: personType, job_home_id: jobHomeId },
        withCredentials: true
      });
      setSelectedPerson(response.data.person);
    } catch (error) {
      console.error('Error fetching person:', error);
      setSelectedPerson(null);
    }
  };

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
  };

  const handleSendMessage = async () => {
    if (!selectedPerson || !message.trim()) return;

    setLoading(true);
    try {
      const payload = {
        job_home_id: jobHomeId,
        phoneno: selectedPerson.contact_number,
        person_number: selectedPerson.contact_number,
        message: message.trim(),
      };

      await api.post('/messages', payload, { withCredentials: true });
      setNotification({ message: 'Message sent successfully!', type: 'success' });
      setMessage('');
      setTimeout(() => {
        setNotification({ message: '', type: 'success' });
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      setNotification({ message: 'Failed to send message. Please try again.', type: 'error' });
      setTimeout(() => {
        setNotification({ message: '', type: 'success' });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: 'success' })} />
      <div className={`p-6 rounded-lg w-full max-w-2xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
        <h2 className="text-2xl font-bold mb-6 text-center">Send Message</h2>

      {/* Person Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Person Type</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="customer"
              checked={personType === 'customer'}
              onChange={(e) => setPersonType(e.target.value)}
              className="mr-2"
            />
            Contact Customer
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="contact_person"
              checked={personType === 'contact_person'}
              onChange={(e) => setPersonType(e.target.value)}
              className="mr-2"
            />
            Contact Person
          </label>
        </div>
      </div>

      {/* Display Contact Customer or Contact Person phone number */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Number
        </label>
        <div className={`p-3 border rounded-lg ${
          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300'
        }`}>
          {selectedPerson ? selectedPerson.contact_number : 'Select a person to view number'}
        </div>
      </div>

      {/* Message Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message..."
          rows={4}
          className={`w-full p-3 border rounded-lg resize-none ${
            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
          }`}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className={`px-6 py-2 rounded-lg ${
            isDarkMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleSendMessage}
          disabled={!selectedPerson || !message.trim() || loading}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
            !selectedPerson || !message.trim() || loading
              ? 'bg-blue-600 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-800 text-white'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending...
            </>
          ) : (
            <>
              <FaPaperPlane />
              Send Message
            </>
          )}
        </button>
      </div>
    </div>
    </>
  );
};

export default Message;
