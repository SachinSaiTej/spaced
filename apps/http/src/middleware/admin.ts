import jwt from 'jsonwebtoken';
import { JWT_PASSWORD } from '../config';
import { NextFunction, Request, Response } from 'express';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_PASSWORD) as { userId: string, role: string };
        if (decoded.role !== "admin") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        req.userId = decoded.userId;
        req.role = decoded.role == 'admin' ? "Admin" : "User";
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
}