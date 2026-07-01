const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireWorkflowRole } = require('../middleware/workflowAuthMiddleware');

const {
    getAllDesigns,
    searchDesigns,
    getDesignById,
    createDesign,
    updateDesign,
    deleteDesign,
    getLeadTimeMasterRules,
    upsertLeadTimeMasterRule
} = require('../controllers/designLibraryController');

router.use(protect);

// Design Library
router.get('/search',            searchDesigns);
router.get('/',                  getAllDesigns);
router.get('/:id',               getDesignById);
router.post('/',                 requireWorkflowRole('Admin'), createDesign);
router.put('/:id',               requireWorkflowRole('Admin'), updateDesign);
router.delete('/:id',            requireWorkflowRole('Admin'), deleteDesign);

// Lead Time Master (Admin only)
router.get('/lead-time-master',  getLeadTimeMasterRules);
router.post('/lead-time-master', requireWorkflowRole('Admin'), upsertLeadTimeMasterRule);

module.exports = router;
