import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  params: { [key: string]: string };
};

export type RouteHandler<T = any> = (
  req: NextRequest,
  context: RouteParams
) => Promise<Response> | Response | NextResponse;

declare module 'next' {
  interface NextApiRequest {
    json: () => Promise<any>;
  }
}

declare module 'next/server' {
  interface NextRequest {
    json: () => Promise<any>;
  }
  
  // Override the default route handler types
  type RouteHandlerContext = {
    params: { [key: string]: string | string[] };
  };
  
  type RouteHandler = (
    request: NextRequest,
    context: RouteHandlerContext
  ) => Promise<Response | NextResponse> | Response | NextResponse;
  
  export function GET(request: NextRequest, context: RouteHandlerContext): Promise<Response | NextResponse>;
  export function POST(request: NextRequest, context: RouteHandlerContext): Promise<Response | NextResponse>;
  export function PUT(request: NextRequest, context: RouteHandlerContext): Promise<Response | NextResponse>;
  export function PATCH(request: NextRequest, context: RouteHandlerContext): Promise<Response | NextResponse>;
  export function DELETE(request: NextRequest, context: RouteHandlerContext): Promise<Response | NextResponse>;
  export function HEAD(request: NextRequest, context: RouteHandlerContext): Promise<Response | NextResponse>;
  export function OPTIONS(request: NextRequest, context: RouteHandlerContext): Promise<Response | NextResponse>;
}
