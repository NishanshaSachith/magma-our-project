import React, { useState, useEffect } from "react";
import axios from "axios";

const ItimPage = () => {
    const [items, setItems] = useState([]);
    const [localTimes, setLocalTimes] = useState({}); // Store local modified times

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/items");
                setItems(response.data);

                // Initialize localTimes with current service_timeout values
                const initialTimes = {};
                response.data.forEach(item => {
                    initialTimes[item.id] = item.service_timeout || "";
                });
                setLocalTimes(initialTimes);
            } catch (error) {
                console.error("Error fetching items:", error);
            }
        };

        fetchItems();
    }, []);

    const handleTimeChange = (itemId, newTime) => {
        setLocalTimes(prevTimes => ({
            ...prevTimes,
            [itemId]: newTime
        }));
    };

    return (
        <div className="p-6 min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Modify Item Time (Local Only)</h1>
            {items.length === 0 ? (
                <p>No items found.</p>
            ) : (
                <table className="min-w-full bg-white rounded shadow">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">Item Name</th>
                            <th className="py-2 px-4 border-b">Current Time</th>
                            <th className="py-2 px-4 border-b">Modify Time (Local)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="py-2 px-4 border-b">{item.name}</td>
                                <td className="py-2 px-4 border-b">{item.service_timeout || "N/A"}</td>
                                <td className="py-2 px-4 border-b">
                                    <input
                                        type="text"
                                        value={localTimes[item.id] || ""}
                                        onChange={(e) => handleTimeChange(item.id, e.target.value)}
                                        className="border rounded px-2 py-1 w-full"
                                        placeholder="Enter new time"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <p className="mt-4 text-sm text-gray-600">
                Note: Changes here are local only and will not be saved to the database.
            </p>
        </div>
    );
};

export default ItimPage;
