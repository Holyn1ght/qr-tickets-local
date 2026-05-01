import { Response } from "express";

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
};

export const sendError = (res: Response, message: string, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
    },
  });
};
