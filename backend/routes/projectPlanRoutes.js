const express = require('express');
const router = express.Router();
const { getProjectPlan, updateProjectPlan } = require('../controllers/projectPlanController');

router.route('/:trackerId')
    .get(getProjectPlan)
    .put(updateProjectPlan);

module.exports = router;
