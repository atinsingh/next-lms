import { NextRequest, NextResponse } from 'next/server';

export type RouteParams = {
  [key: string]: string | string[] | undefined;
};

export type RouteHandler = (
  req: NextRequest,
  context: { params: RouteParams }
) => Promise<Response> | Response;

export type RouteHandlers = {
  GET?: RouteHandler;
  POST?: RouteHandler;
  PUT?: RouteHandler;
  DELETE?: RouteHandler;
  PATCH?: RouteHandler;
  HEAD?: RouteHandler;
  OPTIONS?: RouteHandler;
};

export function createRouteHandlers(handlers: RouteHandlers) {
  return {
    GET: handlers.GET ? wrapHandler(handlers.GET) : undefined,
    POST: handlers.POST ? wrapHandler(handlers.POST) : undefined,
    PUT: handlers.PUT ? wrapHandler(handlers.PUT) : undefined,
    DELETE: handlers.DELETE ? wrapHandler(handlers.DELETE) : undefined,
    PATCH: handlers.PATCH ? wrapHandler(handlers.PATCH) : undefined,
    HEAD: handlers.HEAD ? wrapHandler(handlers.HEAD) : undefined,
    OPTIONS: handlers.OPTIONS ? wrapHandler(handlers.OPTIONS) : undefined,
  };
}

function wrapHandler(handler: RouteHandler) {
  return async function (req: NextRequest, context: { params: any }) {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('Route handler error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
