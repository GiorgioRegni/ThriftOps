import type { NextFunction, Request, Response } from "express";
import { adminAuth } from "./firebaseAdmin.js";
import { prisma } from "./prisma.js";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      memberRole?: string;
    }
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    if (!token) throw new HttpError(401, "Missing bearer token.");
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      displayName: decoded.name || decoded.email || ""
    };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid bearer token."));
  }
};

export const requireOrgMember = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, "Authentication required.");
    const member = await prisma.member.findUnique({
      where: { orgId_uid: { orgId: String(req.params.orgId), uid: req.user.uid } }
    });
    if (!member) throw new HttpError(403, "Org membership required.");
    req.memberRole = member.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireWriteRole = (req: Request, _res: Response, next: NextFunction) => {
  if (["owner", "admin", "member"].includes(req.memberRole || "")) return next();
  next(new HttpError(403, "Write access required."));
};

export const requireManageRole = (req: Request, _res: Response, next: NextFunction) => {
  if (["owner", "admin"].includes(req.memberRole || "")) return next();
  next(new HttpError(403, "Org management access required."));
};

export const asyncRoute = (handler: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error." });
};
