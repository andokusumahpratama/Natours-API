class AppError extends Error{
    constructor(message, statusCode, err = 'Fail'){   // err = null itu tambahan aja dari gw sendiri
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'Fail' : 'Error';
        this.isOperational = true;
        this.errors = err;
        // this.stacks = new Error(message).stack;  //  Ini kalau mau error stack

        Error.captureStackTrace(this, this.constructor);        
    }
}

module.exports = AppError;