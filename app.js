const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the provided frontend without modifying its files
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err.message));

// Employee schema
const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true }
});

const Employee = mongoose.model('Employee', employeeSchema);

// GET: Retrieve all employees
app.get('/api/employeelist', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve employees' });
    }
});

// GET: Retrieve one employee
app.get('/api/employeelist/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid employee ID' });
        }

        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve employee' });
    }
});

// POST: Add an employee
app.post('/api/employeelist', async (req, res) => {
    try {
        const { name, location, position, salary } = req.body;

        if (!name || !location || !position || salary === undefined ||
            salary === '' || !Number.isFinite(Number(salary)) ||
            Number(salary) < 0) {
            return res.status(400).json({ error: 'Valid employee details are required' });
        }

        const employee = await Employee.create({
            name,
            location,
            position,
            salary: Number(salary)
        });

        res.status(201).json(employee);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

// DELETE: Remove one employee
app.delete('/api/employeelist/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'Invalid employee ID' });
        }

        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});


// PUT: Update one employee

app.put('/api/employeelist', async (req, res) => {
    try {
        const { _id, name, location, position, salary } = req.body;

        if (!_id || !mongoose.isValidObjectId(_id)) {
            return res.status(400).json({ error: 'Invalid employee ID' });
        }

        if (!name || !location || !position ||
            salary === undefined || salary === '' ||
            !Number.isFinite(Number(salary)) || Number(salary) < 0) {
            return res.status(400).json({ error: 'Valid employee details are required' });
        }

        const employee = await Employee.findByIdAndUpdate(
            _id,
            {
                name,
                location,
                position,
                salary: Number(salary)
            },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});


// Keep the frontend fallback
app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next();
    }

    res.sendFile(
        path.join(__dirname, 'dist', 'Frontend', 'index.html'),
        (err) => {
            if (err) next(err);
        }
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


