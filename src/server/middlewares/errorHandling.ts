import { IError, APIError } from "../domain/IError"; 
import {Request, Response, NextFunction} from 'express';

export default (error: APIError, req: Request, res: Response, next: NextFunction): void => {
    console.error(error.stack);
    const status = error.status || 500;
    const message = error.message || 'Something went wrong';
    res
      .status(status)
      .json({
        status,
        message,
    });
}
