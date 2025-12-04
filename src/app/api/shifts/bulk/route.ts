import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  const json = await request.json()
  const { ids, data } = json

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
  }

  await prisma.shift.updateMany({
    where: {
      id: {
        in: ids
      }
    },
    data
  })

  return NextResponse.json({ success: true })
}
