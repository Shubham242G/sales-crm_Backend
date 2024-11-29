import { Request, Response } from 'express';
import { LeaveType } from "../../models/leaveType.model";

// Create a new leave type
export const createLeaveType = async (req: Request, res: Response) => {
    try {
        const leaveType = new LeaveType(req.body);
        const savedLeaveType = await leaveType.save();
        res.status(201).json(savedLeaveType);
    } catch (err) {
        res.status(400).json({ error: "error creating leave Type" });
    }
};

// Get all leave types
export const getLeaveTypes = async (req: Request, res: Response) => {
    try {
        const leaveTypes = await LeaveType.find();
        res.status(200).json(leaveTypes);
    } catch (err) {
        res.status(400).json({ error: "error getting leave type" });
    }
};

// Get a leave type by ID
export const getLeaveTypeById = async (req: Request, res: Response) => {
    try {
        const leaveType = await LeaveType.findById(req.params.id);
        if (!leaveType) {
            return res.status(404).json({ error: "LeaveType not found" });
        }
        res.status(200).json(leaveType);
    } catch (err) {
        res.status(400).json({ error: "error getting leave type by ID" });
    }
};

// Update a leave type by ID
export const updateLeaveType = async (req: Request, res: Response) => {
    try {
        const leaveType = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!leaveType) {
            return res.status(404).json({ error: "LeaveType not found" });
        }
        res.status(200).json(leaveType);
    } catch (err) {
        res.status(400).json({ error: "Error updating leave type" });
    }
};

// Delete a leave type by ID
export const deleteLeaveType = async (req: Request, res: Response) => {
    try {
        const leaveType = await LeaveType.findByIdAndDelete(req.params.id);
        if (!leaveType) {
            return res.status(404).json({ error: "LeaveType not found" });
        }
        res.status(200).json({ message: "LeaveType deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: "Error deleting leave Type" });
    }
};
