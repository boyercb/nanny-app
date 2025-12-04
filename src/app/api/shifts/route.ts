import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const shifts = await prisma.shift.findMany()
  return NextResponse.json(shifts)
}

export async function POST(request: Request) {
  const json = await request.json()
  // Ensure dates are Date objects
  const data = {
    ...json,
    start: new Date(json.start),
    end: new Date(json.end),
  }
  const shift = await prisma.shift.create({
    data,
  })
  return NextResponse.json(shift)
}
