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
  const { hourlyRate, sickHoursAllowance, vacationHoursAllowance } = body

  const updateData: any = {}
  if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate)
  if (sickHoursAllowance !== undefined) updateData.sickHoursAllowance = parseInt(sickHoursAllowance)
  if (vacationHoursAllowance !== undefined) updateData.vacationHoursAllowance = parseInt(vacationHoursAllowance)

  const config = await prisma.config.upsert({
    where: { id: 1 },
    update: updateData,
    create: { 
      id: 1,
      hourlyRate: hourlyRate || 25,
      sickHoursAllowance: sickHoursAllowance || -1,
      vacationHoursAllowance: vacationHoursAllowance || 42
    }
  })

  return NextResponse.json(config)
}
