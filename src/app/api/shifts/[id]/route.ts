import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const json = await request.json()
  const data = {
    ...json,
    start: json.start ? new Date(json.start) : undefined,
    end: json.end ? new Date(json.end) : undefined,
  }
  const shift = await prisma.shift.update({
    where: { id },
    data,
  })
  return NextResponse.json(shift)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  await prisma.shift.delete({
    where: { id },
  })
  return NextResponse.json({ success: true })
}
