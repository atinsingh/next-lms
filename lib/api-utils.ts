import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  [key: string]: string | string[] | undefined;
};

type RouteHandler = (
  req: NextRequest,
  context: { params: RouteParams }
) => Promise<Response> | Response;

export function createRouteHandler(handlers: {
  GET?: RouteHandler;
  POST?: RouteHandler;
  PUT?: RouteHandler;
  DELETE?: RouteHandler;
  PATCH?: RouteHandler;
}) {
  return {
    GET: (async (req: NextRequest, context: { params: RouteParams }) => {
      if (handlers.GET) return handlers.GET(req, context);
      return new NextResponse('Method Not Allowed', { status: 405 });
    }) as any,
    
    POST: (async (req: NextRequest, context: { params: RouteParams }) => {
      if (handlers.POST) return handlers.POST(req, context);
      return new NextResponse('Method Not Allowed', { status: 405 });
    }) as any,
    
    PUT: (async (req: NextRequest, context: { params: RouteParams }) => {
      if (handlers.PUT) return handlers.PUT(req, context);
      return new NextResponse('Method Not Allowed', { status: 405 });
    }) as any,
    
    DELETE: (async (req: NextRequest, context: { params: RouteParams }) => {
      if (handlers.DELETE) return handlers.DELETE(req, context);
      return new NextResponse('Method Not Allowed', { status: 405 });
    }) as any,
    
    PATCH: (async (req: NextRequest, context: { params: RouteParams }) => {
      if (handlers.PATCH) return handlers.PATCH(req, context);
      return new NextResponse('Method Not Allowed', { status: 405 });
    }) as any,
  };
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  return new NextResponse(
    JSON.stringify({ error: 'Internal Server Error' }), 
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

export function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
