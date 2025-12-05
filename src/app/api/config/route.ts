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
        hourlyRate: 25
      }
    })
  }

  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { hourlyRate, sickDaysAllowance, vacationDaysAllowance } = body

  const updateData: any = {}
  if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate)
  if (sickDaysAllowance !== undefined) updateData.sickDaysAllowance = parseInt(sickDaysAllowance)
  if (vacationDaysAllowance !== undefined) updateData.vacationDaysAllowance = parseInt(vacationDaysAllowance)

  const config = await prisma.config.upsert({
    where: { id: 1 },
    update: updateData,
    create: { 
      id: 1,
      hourlyRate: hourlyRate || 25,
      sickDaysAllowance: sickDaysAllowance || 5,
      vacationDaysAllowance: vacationDaysAllowance || 10
    }
  })

  return NextResponse.json(config)
}
