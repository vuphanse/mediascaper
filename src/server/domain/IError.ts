export interface IError{
    status: number;
    message: string;
}

export class APIError extends Error implements IError {
    status: number;
    constructor(status: number, message: string) {
        super();
        this.status = status;
        this.message = message;
    }
}