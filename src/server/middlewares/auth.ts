import base64 from "base-64";
import {Request, Response, NextFunction, request} from 'express';
import { configs } from "../configs";
import { APIError } from '../domain/IError';

export default function authenticate(req: Request, res: Response, next: NextFunction): void {
    if (!req.headers.authorization)
        return next(new APIError(403, "Access denied"));

    let parts: string[] = (<string>req.headers.authorization).split(" ");
    if (parts.length < 2)
        return next(new APIError(403, "Failed to parse authorization header"));

    if (parts[0] != "Basic")
        return next(new APIError(403, "Unsupported authorization method"));

    let decoded: string = "";

    try {
        decoded = base64.decode(parts[1]);
    } catch (err) {
        return next(new APIError(403, "Unsupported authorization method"));
    }

    let indexOfColon = decoded.indexOf(":");
    if (indexOfColon == -1)
        return next(new APIError(403, "Failed to parse authorization header"));

    let username = decoded.slice(0, indexOfColon);
    let password = decoded.slice(indexOfColon + 1);
    let found = configs.authusers.find(user => user.username == username && password == password);
    
    if (found)
        next();
    else
        next(new APIError(403, "Access denied, wrong username or password"));
}