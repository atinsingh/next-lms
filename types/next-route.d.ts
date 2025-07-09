import 'next';

declare module 'next' {
  // Extend the Next.js types for route handlers
  interface RouteHandlerContext {
    params: Record<string, string | string[]>;
  }

  // Type for route handler functions
  type RouteHandler = (
    request: Request,
    context: RouteHandlerContext
  ) => Promise<Response> | Response;

  // Export route handler types for each HTTP method
  export const GET: RouteHandler;
  export const POST: RouteHandler;
  export const PUT: RouteHandler;
  export const PATCH: RouteHandler;
  export const DELETE: RouteHandler;
  export const HEAD: RouteHandler;
  export const OPTIONS: RouteHandler;
}

// Extend the global scope for module augmentation
declare global {
  // This helps TypeScript understand our route handler types
  namespace NodeJS {
    interface ProcessEnv {
      // Add any environment variables here if needed
    }
  }
}
