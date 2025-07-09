import { NextResponse } from 'next/server';

type JsonResponseOptions = {
  status?: number;
  headers?: Record<string, string>;
};

export function jsonResponse<T = any>(
  data: T,
  { status = 200, headers = {} }: JsonResponseOptions = {}
) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
) {
  return jsonResponse(
    { 
      error: message,
      ...(details && { details }) 
    },
    { status }
  );
}

export const responses = {
  // Success responses
  ok: <T = any>(data: T) => jsonResponse(data, { status: 200 }),
  created: <T = any>(data: T) => jsonResponse(data, { status: 201 }),
  noContent: () => new NextResponse(null, { status: 204 }),
  
  // Error responses
  badRequest: (message: string = 'Bad Request', details?: any) => 
    errorResponse(message, 400, details),
  unauthorized: (message: string = 'Unauthorized') => 
    errorResponse(message, 401),
  forbidden: (message: string = 'Forbidden') => 
    errorResponse(message, 403),
  notFound: (message: string = 'Not Found') => 
    errorResponse(message, 404),
  conflict: (message: string = 'Conflict') => 
    errorResponse(message, 409),
  validationError: (errors: any) => 
    errorResponse('Validation Error', 422, { errors }),
  internalServerError: (error?: Error) => {
    console.error('Server Error:', error);
    return errorResponse(
      'Internal Server Error', 
      500, 
      process.env.NODE_ENV === 'development' ? { error: error?.message } : undefined
    );
  },
};
