import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  let config = await prisma.config.findUnique({
    where: { id: 1 }
  })

  if (!config) {
    config = await prisma.config.create({
      data: {
        id: 1,
        hourlyRate: 20
      }
    })
  }

  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { hourlyRate } = body

  const config = await prisma.config.upsert({
    where: { id: 1 },
    update: { hourlyRate: parseFloat(hourlyRate) },
    create: { 
      id: 1,
      hourlyRate: parseFloat(hourlyRate) 
    }
  })

  return NextResponse.json(config)
}
