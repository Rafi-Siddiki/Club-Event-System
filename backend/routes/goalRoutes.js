const express = require('express');
const router = express.Router();
const { getGoal, setGoal, putGoal, deleteGoal} = require('../controllers/goalController');


router.route('/')
    .get(getGoal)
    .post(setGoal)

router.route('/:id')
    .put(putGoal)
    .delete(deleteGoal)


module.exports = router;