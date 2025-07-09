import 'next';
import { NextApiRequest, NextApiResponse } from 'next';

declare module 'next' {
  // Extend NextApiRequest with any custom properties
  interface NextApiRequest {
    user?: any;
    userId?: string;
    // Add other custom properties as needed
  }

  // Extend NextApiResponse with any custom methods
  interface NextApiResponse<T = any> {
    json: (body: T) => void;
    status: (code: number) => NextApiResponse<T>;
    send: (body: T) => void;
    // Add other custom methods as needed
  }

  // Type for route handler context
  interface NextApiHandlerContext {
    params: {
      [key: string]: string | string[] | undefined;
    };
  }

  // Type for route handlers
  type NextApiHandler<T = any> = (
    req: NextApiRequest,
    res: NextApiResponse<T>,
    context?: NextApiHandlerContext
  ) => void | Promise<void>;

  // Type for App Router API route handlers
  type RouteHandler = (
    request: Request,
    context: { params: { [key: string]: string | string[] | undefined } }
  ) => Promise<Response> | Response;
}

// Extend the global Window interface if needed
declare global {
  interface Window {
    __NEXT_DATA__?: any;
    // Add other global window properties as needed
  }
}

// Add type declarations for Next.js App Router
declare module 'next/server' {
  export interface NextRequest extends Request {
    nextUrl: URL;
    cookies: {
      get: (name: string) => { name: string; value: string } | undefined;
      set: (name: string, value: string, options?: any) => void;
      delete: (name: string) => void;
    };
  }

  export interface NextResponse extends Response {
    static json(data: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
  }

  export const NextResponse: {
    new (body?: BodyInit | null, init?: ResponseInit): NextResponse;
    json(data: any, init?: ResponseInit): NextResponse;
    redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
  };

  export type RouteHandlerContext = {
    params: { [key: string]: string | string[] | undefined };
  };

  export type RouteHandler = (
    request: NextRequest,
    context: RouteHandlerContext
  ) => Promise<Response> | Response;

  // Export route handler types for each HTTP method
  export const GET: RouteHandler;
  export const POST: RouteHandler;
  export const PUT: RouteHandler;
  export const DELETE: RouteHandler;
  export const PATCH: RouteHandler;
  export const HEAD: RouteHandler;
  export const OPTIONS: RouteHandler;
}
