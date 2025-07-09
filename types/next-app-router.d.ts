import 'next';

declare module 'next' {
  export interface NextApiRequest {
    // Add any custom properties to the request object here
    user?: any;
  }

  export interface NextApiResponse {
    // Add any custom methods to the response object here
    json: (body: any) => void;
    status: (code: number) => NextApiResponse;
    send: (body: any) => void;
  }
}

declare module 'next/server' {
  export interface NextRequest extends Request {}
  
  export interface NextResponse extends Response {
    json: (body: any) => NextResponse;
    status: (code: number) => NextResponse;
  }
}

declare global {
  // Extend the global Window interface if needed
  interface Window {
    __NEXT_DATA__?: any;
  }
}
