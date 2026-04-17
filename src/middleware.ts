import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/stripe/webhook',
    '/sitemap.xml',
    '/robots.txt',
  ],
}
