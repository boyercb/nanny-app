'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)
// @ts-ignore
const DnDCalendar = withDragAndDrop(Calendar)

interface Shift {
  id: number
  start: Date
  end: Date
  title?: string
  hourlyRate: number
}

export default function CalendarComponent() {
  const [events, setEvents] = useState<Shift[]>([])
  const [hourlyRate, setHourlyRate] = useState(20)
  const [view, setView] = useState(Views.WEEK)
  const [date, setDate] = useState(new Date())

  // Fetch events
  useEffect(() => {
    fetch('/api/shifts')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end)
        }))
        setEvents(formatted)
      })
  }, [])

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const title = 'Nanny Shift'
      const newEvent = { start, end, title, hourlyRate }

      fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })
        .then(res => res.json())
        .then(savedEvent => {
           setEvents(prev => [...prev, { ...savedEvent, start: new Date(savedEvent.start), end: new Date(savedEvent.end) }])
        })
    },
    [hourlyRate]
  )

  const handleEventDrop = useCallback(
    ({ event, start, end }: any) => {
      const updatedEvent = { ...event, start, end }
      setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e))

      fetch(`/api/shifts/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end }),
      })
    },
    []
  )

  const handleEventResize = useCallback(
    ({ event, start, end }: any) => {
      const updatedEvent = { ...event, start, end }
      setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e))

      fetch(`/api/shifts/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end }),
      })
    },
    []
  )

  const handleSelectEvent = useCallback((event: Shift) => {
      if(confirm('Delete this shift?')) {
          setEvents(prev => prev.filter(e => e.id !== event.id))
          fetch(`/api/shifts/${event.id}`, { method: 'DELETE' })
      }
  }, [])

  // Calculate pay based on view
  const { start, end, label } = useMemo(() => {
    let start, end, label;
    if (view === Views.MONTH) {
      start = moment(date).startOf('month').toDate();
      end = moment(date).endOf('month').toDate();
      label = `Month of ${moment(date).format('MMMM')}`;
    } else if (view === Views.DAY) {
      start = moment(date).startOf('day').toDate();
      end = moment(date).endOf('day').toDate();
      label = moment(date).format('MMM D, YYYY');
    } else {
      // Default to WEEK
      start = moment(date).startOf('week').toDate();
      end = moment(date).endOf('week').toDate();
      label = `Week of ${moment(start).format('MMM D')}`;
    }
    return { start, end, label };
  }, [view, date]);

  const filteredEvents = events.filter(e =>
      e.start >= start && e.end <= end
  )

  const totalHours = filteredEvents.reduce((acc, curr) => {
      const duration = (curr.end.getTime() - curr.start.getTime()) / (1000 * 60 * 60)
      return acc + duration
  }, 0)

  const totalPay = filteredEvents.reduce((acc, curr) => {
      const duration = (curr.end.getTime() - curr.start.getTime()) / (1000 * 60 * 60)
      return acc + (duration * hourlyRate)
  }, 0)

  const weeklyBreakdown = useMemo(() => {
    if (view !== Views.MONTH) return [];

    const startOfMonth = moment(date).startOf('month');
    const endOfMonth = moment(date).endOf('month');
    const weeks = [];
    
    let current = startOfMonth.clone().startOf('week');
    
    while (current.isBefore(endOfMonth)) {
      const weekStart = current.toDate();
      const weekEnd = current.clone().endOf('week').toDate();
      
      const weekEvents = events.filter(e => 
        e.start >= weekStart && e.start <= weekEnd
      );
      
      const hours = weekEvents.reduce((acc, curr) => {
          const duration = (curr.end.getTime() - curr.start.getTime()) / (1000 * 60 * 60)
          return acc + duration
      }, 0);

      const pay = hours * hourlyRate;
      
      if (pay > 0) {
        weeks.push({
            label: `${moment(weekStart).format('MMM D')}-${moment(weekEnd).format('D')}`,
            pay,
            hours
        });
      }
      
      current.add(1, 'week');
    }
    return weeks;
  }, [view, date, events, hourlyRate]);

  const components = useMemo(() => ({
    month: {
      event: ({ event }: any) => (
        <div className="text-xs">
           {moment(event.start).format('h:mma')}-{moment(event.end).format('h:mma')} {event.title}
        </div>
      )
    }
  }), [])

  return (
    <div className="h-screen p-4 flex flex-col gap-4 bg-gray-50">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold text-gray-800">Nanny Tracker</h1>
        <div className="flex gap-4 items-center">
            <label className="text-gray-700 font-medium">
                Hourly Rate: $
                <input
                    type="number"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value))}
                    className="border border-gray-300 p-1 rounded ml-2 w-20 text-right"
                />
            </label>
            <div className="text-right border-l pl-4 border-gray-200">
                <div className="text-sm text-gray-600">{label}</div>
                <div className="text-sm text-gray-600">Total Hours: {totalHours.toFixed(2)}</div>
                <div className="text-xl font-bold text-green-600">Total Pay: ${totalPay.toFixed(2)}</div>
                {view === Views.MONTH && weeklyBreakdown.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                    {weeklyBreakdown.map((week, i) => (
                      <div key={i} className="flex justify-between gap-4">
                        <span className="text-gray-500">{week.label}:</span>
                        <span className="font-medium">
                            ${week.pay.toFixed(2)} <span className="text-gray-400 text-[10px]">({week.hours.toFixed(1)}h)</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
        </div>
      </div>

      <div className="flex-1 bg-white p-4 rounded shadow overflow-hidden">
        <DnDCalendar
          localizer={localizer}
          events={events}
          defaultView={Views.WEEK}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          step={30}
          date={date}
          view={view}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelectEvent={handleSelectEvent}
          selectable
          resizable
          components={components}
          style={{ height: '100%' }}
          onNavigate={(date: Date) => setDate(date)}
          onView={(view: any) => setView(view)}
          eventPropGetter={(event: Shift) => ({
              className: 'bg-blue-500 text-white rounded border-none shadow-sm'
          })}
        />
      </div>
    </div>
  )
}
