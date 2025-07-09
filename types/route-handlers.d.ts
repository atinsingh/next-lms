import 'next';

declare module 'next/server' {
  interface NextRequest extends Request {}
  
  interface NextResponse extends Response {}
  
  // Define the expected shape of route parameters
  interface RouteParams {
    params: Promise<{ [key: string]: string }>;
  }
  
  // Define the route handler type
  type RouteHandler = (
    request: NextRequest,
    context: RouteParams
  ) => Promise<Response> | Response;
  
  // Extend the global namespace for route handlers
  interface RouteHandlers {
    GET?: RouteHandler;
    POST?: RouteHandler;
    PUT?: RouteHandler;
    DELETE?: RouteHandler;
    PATCH?: RouteHandler;
    HEAD?: RouteHandler;
    OPTIONS?: RouteHandler;
  }
}
