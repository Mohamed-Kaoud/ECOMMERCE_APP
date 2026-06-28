import { HydratedDocument } from "mongoose";
import { User } from "../../DB/models/user.model";
import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
    interface Request {
        user: HydratedDocument<User>,
        decoded: JwtPayload
    }
}