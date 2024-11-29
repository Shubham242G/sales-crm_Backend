import { Shift } from "@models/shift.model";
import { NextFunction, Request, Response } from "express";



export const createShift = async (req: Request, res: Response) => {
    try {
        const shift = new Shift(req.body);
        const savedShift = await shift.save();
        res.status(201).json(savedShift);
    } catch (error) {
        res.status(500).json({ message: "Error creating shift", error });
    }
};

export const getAllShifts = async (req: Request, res: Response) => {
    try {
        const shifts = await Shift.find();
        res.status(200).json(shifts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching shifts", error });
    }
};

export const getShiftById = async (req: Request, res: Response) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (shift) {
            res.status(200).json(shift);
        } else {
            res.status(404).json({ message: "Shift not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error fetching shift", error });
    }
};

export const updateShift = async (req: Request, res: Response) => {
    try {
        const updatedShift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updatedShift) {
            res.status(200).json(updatedShift);
        } else {
            res.status(404).json({ message: "Shift not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating shift", error });
    }
};

export const deleteShift = async (req: Request, res: Response) => {
    try {
        const deletedShift = await Shift.findByIdAndDelete(req.params.id);
        if (deletedShift) {
            res.status(200).json({ message: "Shift deleted successfully" });
        } else {
            res.status(404).json({ message: "Shift not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error deleting shift", error });
    }
};
