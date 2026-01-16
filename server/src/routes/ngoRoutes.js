// server/src/routes/ngoRoutes.js
import express from 'express';
import NGO from '../models/NGO.js';

const router = express.Router();

// Get list of all active NGOs for volunteer registration
router.get('/list', async (req, res) => {
    try {
        const ngos = await NGO.find({ status: 'active' })
            .select('ngoName ngoType ngoRegistrationNumber')
            .sort({ ngoName: 1 });

        res.json(ngos);
    } catch (error) {
        console.error('Error fetching NGOs:', error);
        res.status(500).json({ message: 'Failed to fetch NGOs', error: error.message });
    }
});

// Get NGO by ID
router.get('/:id', async (req, res) => {
    try {
        const ngo = await NGO.findById(req.params.id);
        if (!ngo) {
            return res.status(404).json({ message: 'NGO not found' });
        }
        res.json(ngo);
    } catch (error) {
        console.error('Error fetching NGO:', error);
        res.status(500).json({ message: 'Failed to fetch NGO', error: error.message });
    }
});

export default router;
