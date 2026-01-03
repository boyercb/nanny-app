import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escape(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(line: string) {
  if (line.length <= 74) return line
  const parts: string[] = []
  let remaining = line
  while (remaining.length > 74) {
    parts.push(remaining.slice(0, 74))
    remaining = ' ' + remaining.slice(74)
  }
  parts.push(remaining)
  return parts.join('\r\n')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const expected = process.env.ICS_FEED_TOKEN

  if (expected && token !== expected) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const shifts = await prisma.shift.findMany({
    orderBy: { start: 'asc' }
  })

  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Nanny Shift Tracker//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  lines.push('X-WR-CALNAME:Nanny Shifts')
  lines.push('X-WR-TIMEZONE:UTC')
  lines.push('REFRESH-INTERVAL;VALUE=DURATION:PT1H')
  lines.push('X-PUBLISHED-TTL:PT1H')

  const now = formatICSDate(new Date())

  shifts.forEach((shift) => {
    const uid = `shift-${shift.id}@nanny-shift-tracker`
    const summary = escape(`${shift.title || 'Shift'}${shift.type ? ` (${shift.type})` : ''}`)
    const descriptionParts: string[] = []
    descriptionParts.push(`Type: ${shift.type || 'WORK'}`)
    descriptionParts.push(`Rate: $${shift.hourlyRate}/hr`)
    descriptionParts.push(`Paid: ${shift.isPaid ? 'Yes' : 'No'}`)
    if (shift.notes) descriptionParts.push(`Notes: ${shift.notes}`)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART:${formatICSDate(new Date(shift.start))}`)
    lines.push(`DTEND:${formatICSDate(new Date(shift.end))}`)
    lines.push(`SUMMARY:${summary}`)
    lines.push(`DESCRIPTION:${escape(descriptionParts.join('\n'))}`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')

  const folded = lines.map(foldLine)
  const body = folded.join('\r\n') + '\r\n'

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nanny-shifts.ics"',
      'Cache-Control': 'public, max-age=300'
    }
  })
}
