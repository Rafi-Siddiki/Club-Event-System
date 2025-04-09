const asyncHandler = require('express-async-handler')

const Goal = require('../models/goalModel')

// @desc Get goals
// @route GET /api/goals
const getGoal = asyncHandler(async (req, res) => {
    const goal = await Goal.find()
    res.json(goal);
})

// @desc Set goals
// @route POST /api/goals
const setGoal = asyncHandler(async (req, res) => {
    if (!req.body.text) {
        res.status(400)
        throw new Error('Please add a text field')
    }
    const goal = await Goal.create({
        text: req.body.text,
    })
    res.json(goal);
})

// @desc Update goals
// @route PUT /api/goals/:id
const putGoal= asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id)
    if (!goal) {
        res.status(400)
        throw new Error('Goal not found')
    }

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    })
    res.json(updatedGoal);
})

// @desc Delete goals
// @route DELETE /api/goals/:id
const deleteGoal = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id)
    if (!goal) {
        res.status(400)
        throw new Error('Goal not found')
    }
    await goal.deleteOne();
    res.json({id: req.params.id});
})


module.exports = {
    getGoal,
    setGoal,
    putGoal,
    deleteGoal
}