const errorHandler = require('../utils/errorHandler');

//Send error for Dev env
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, req, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError')
      error = errorHandler.handleCastErrorDB(error);

    if (error.code === 11000)
      error = errorHandler.handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = errorHandler.handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError')
      error = errorHandler.handleJWTError();
    if (error.name === 'TokenExpiredError')
      error = errorHandler.handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
