// src/types/express.d.ts
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        nombre: string;
        admin: boolean;
      } | JwtPayload;
    }
  }
}
