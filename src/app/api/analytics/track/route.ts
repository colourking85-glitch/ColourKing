import { NextRequest } from 'next/server';
import { POST as pulseHandler } from '@/app/api/pulse/route';

export async function POST(req: NextRequest) {
  return pulseHandler(req);
}
