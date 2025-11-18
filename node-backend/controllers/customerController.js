// customerController.js
const Customer = require('../models/Customer');
const Area = require('../models/Area');
const CustomerArea = require('../models/CustomerArea');
const Branch = require('../models/Branch');

// Helper function to handle full nested population for consistent responses
// This is now efficient due to the 'branches' Virtual on CustomerArea.
const getCustomerFullPopulation = async (id) => {
    return Customer.findById(id)
        .populate({
            path: 'customerAreas',
            populate: [
                { path: 'area_id', model: 'Area' },
                { path: 'branches' } // Populating the virtual field
            ]
        });
};

// --- GET /customers (CRITICAL FIXES HERE) ---
const getCustomers = async (req, res) => {
    try {
        // 1. Fetch data using optimized population
        const customers = await Customer.find()
            .populate({
                path: 'customerAreas',
                populate: [
                    { path: 'area_id', model: 'Area' },
                    { path: 'branches' }
                ]
            });

        const transformed = customers.map(customer => {
            
            // 2. ⚠️ CRITICAL SAFETY FILTER: Remove entries where CustomerArea or Area is null/unpopulated
            const validCustomerAreas = customer.customerAreas
                .filter(ca => ca && ca.area_id && ca.area_id.name); 

            const areas = validCustomerAreas.map(ca => {
                
                // 3. Map branches with safety filter on ca.branches
                const branches = (ca.branches || [])
                    .filter(b => b)
                    .map(branch => ({
                        id: branch._id,
                        branchName: branch.name,
                        branchPhone: branch.phone_no,
                    }));
                
                return {
                    id: ca.area_id._id,
                    areaName: ca.area_id.name,
                    branches: branches
                };
            });

            return {
                id: customer._id,
                customer_id: customer._id,
                customer_name: customer.customer_name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                createdAt: customer.created_at,
                areas: areas
            };
        });

        res.json(transformed);
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getCustomers:", error); 
        res.status(500).json({ message: 'Server error: Data corruption or DB issue', error: error.message });
    }
};

// --- GET /customers/:id (FIXED) ---
const getCustomer = async (req, res) => {
    try {
        // Use the full population helper
        const customer = await getCustomerFullPopulation(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // ⚠️ CRITICAL SAFETY FILTER: Filter out invalid/unpopulated areas
        const validCustomerAreas = customer.customerAreas
            .filter(ca => ca && ca.area_id && ca.area_id.name);

        const areas = validCustomerAreas.map(ca => {
            const branches = (ca.branches || [])
                .filter(b => b)
                .map(branch => ({
                    id: branch._id,
                    branchName: branch.name,
                    branchPhone: branch.phone_no,
                }));
            return {
                id: ca.area_id._id,
                areaName: ca.area_id.name,
                branches: branches
            };
        });

        const transformed = {
            id: customer._id,
            customer_id: customer._id,
            customer_name: customer.customer_name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            createdAt: customer.created_at,
            areas: areas
        };

        res.json(transformed);
    } catch (error) {
        console.error("Error in getCustomer:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- POST /customers (UPDATED response) ---
const createCustomer = async (req, res) => {
    try {
        const { customer_name, email, phone, address, areas } = req.body;

        const customer = new Customer({ customer_name, email, phone, address });
        await customer.save();

        const customerAreaIds = [];
        if (areas && areas.length > 0) {
            for (const areaData of areas) {
                if (!areaData.areaName) continue;

                let area = await Area.findOne({ name: areaData.areaName });
                if (!area) {
                    area = new Area({ name: areaData.areaName });
                    await area.save();
                }

                const customerArea = new CustomerArea({
                    customer_id: customer._id,
                    area_id: area._id,
                });
                await customerArea.save();
                customerAreaIds.push(customerArea._id);

                if (areaData.branches && areaData.branches.length > 0) {
                    for (const branchData of areaData.branches) {
                        if (!branchData.branchName) continue;

                        const branch = new Branch({
                            name: branchData.branchName,
                            phone_no: branchData.branchPhone,
                            customer_area_id: customerArea._id,
                        });
                        await branch.save();
                    }
                }
            }
        }

        customer.customerAreas = customerAreaIds;
        await customer.save();

        // Use helper to send a fully populated customer back
        const newCustomer = await getCustomerFullPopulation(customer._id);
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error("Error in createCustomer:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- PUT /customers/:id (UPDATED logic and response) ---
const updateCustomer = async (req, res) => {
    try {
        const { customer_name, email, phone, address, areas } = req.body;

        let customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Update basic fields
        customer.customer_name = customer_name;
        customer.email = email;
        customer.phone = phone;
        customer.address = address;
        customer.updated_at = Date.now();

        // Delete existing relationships (Manual cascading delete)
        const customerAreas = await CustomerArea.find({ customer_id: customer._id });
        for (const ca of customerAreas) {
            await Branch.deleteMany({ customer_area_id: ca._id });
        }
        await CustomerArea.deleteMany({ customer_id: customer._id });

        // Recreate relationships (same logic as create)
        const customerAreaIds = [];
        if (areas && areas.length > 0) {
            for (const areaData of areas) {
                if (!areaData.areaName) continue;

                let area = await Area.findOne({ name: areaData.areaName });
                if (!area) {
                    area = new Area({ name: areaData.areaName });
                    await area.save();
                }

                const customerArea = new CustomerArea({
                    customer_id: customer._id,
                    area_id: area._id,
                });
                await customerArea.save();
                customerAreaIds.push(customerArea._id);

                if (areaData.branches && areaData.branches.length > 0) {
                    for (const branchData of areaData.branches) {
                        if (!branchData.branchName) continue;

                        const branch = new Branch({
                            name: branchData.branchName,
                            phone_no: branchData.branchPhone,
                            customer_area_id: customerArea._id,
                        });
                        await branch.save();
                    }
                }
            }
        }

        customer.customerAreas = customerAreaIds;
        await customer.save();

        // Use helper to send a fully populated customer back
        const updatedCustomer = await getCustomerFullPopulation(customer._id);
        res.json(updatedCustomer);
    } catch (error) {
        console.error("Error in updateCustomer:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- DELETE /customers/:id (Fixed cascading delete) ---
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Manual cascading delete (CRITICAL FIX)
        const customerAreas = await CustomerArea.find({ customer_id: customer._id });
        for (const ca of customerAreas) {
            await Branch.deleteMany({ customer_area_id: ca._id });
        }
        await CustomerArea.deleteMany({ customer_id: customer._id });

        await customer.deleteOne();

        res.status(204).send();
    } catch (error) {
        console.error("Error in deleteCustomer:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAreas = async (req, res) => {
    try {
        const areas = await Area.find();
        res.json(areas);
    } catch (error) {
        console.error("Error in getAreas:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getAreas };