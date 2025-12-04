'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment'
import { Download, List, Calendar as CalendarIcon, Check, X, Trash2, DollarSign, Clock } from 'lucide-react'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)
// @ts-ignore
const DnDCalendar = withDragAndDrop(Calendar)

interface Shift {
  id?: number
  start: Date
  end: Date
  title?: string
  hourlyRate: number
  isPaid: boolean
  notes?: string
}

export default function CalendarComponent() {
  const [events, setEvents] = useState<Shift[]>([])
  const [hourlyRate, setHourlyRate] = useState(25)
  const [view, setView] = useState<any>(Views.WEEK)
  const [date, setDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)

  // Fetch events and config
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

    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.hourlyRate) {
          setHourlyRate(data.hourlyRate)
        }
      })
  }, [])

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = Number(e.target.value)
    setHourlyRate(newRate)
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hourlyRate: newRate }),
    })
  }

  // --- Calendar Handlers ---

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setSelectedShift({
        start,
        end,
        title: 'Nanny Shift',
        hourlyRate,
        isPaid: false,
        notes: ''
      })
      setIsModalOpen(true)
    },
    [hourlyRate]
  )

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedShift(event as Shift)
    setIsModalOpen(true)
  }, [])

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

  // --- Modal Actions ---

  const saveShift = async () => {
    if (!selectedShift) return

    const method = selectedShift.id ? 'PUT' : 'POST'
    const url = selectedShift.id ? `/api/shifts/${selectedShift.id}` : '/api/shifts'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedShift),
    })
    const savedEvent = await res.json()
    
    const formattedEvent = {
      ...savedEvent,
      start: new Date(savedEvent.start),
      end: new Date(savedEvent.end)
    }

    if (selectedShift.id) {
      setEvents(prev => prev.map(e => e.id === formattedEvent.id ? formattedEvent : e))
    } else {
      setEvents(prev => [...prev, formattedEvent])
    }
    setIsModalOpen(false)
  }

  const deleteShift = async () => {
    if (!selectedShift?.id) return
    if (!confirm('Delete this shift?')) return

    await fetch(`/api/shifts/${selectedShift.id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== selectedShift.id))
    setIsModalOpen(false)
  }

  // --- Export ---

  const exportCSV = () => {
    const headers = ['Start Date', 'Start Time', 'End Date', 'End Time', 'Hours', 'Rate', 'Total', 'Status', 'Notes']
    const rows = events.map(e => {
      const duration = (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60)
      return [
        moment(e.start).format('YYYY-MM-DD'),
        moment(e.start).format('HH:mm'),
        moment(e.end).format('YYYY-MM-DD'),
        moment(e.end).format('HH:mm'),
        duration.toFixed(2),
        e.hourlyRate,
        (duration * e.hourlyRate).toFixed(2),
        e.isPaid ? 'Paid' : 'Unpaid',
        `"${(e.notes || '').replace(/"/g, '""')}"` // Escape quotes
      ].join(',')
    })
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `nanny_shifts_${moment().format('YYYY-MM-DD')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Calculations ---

  const { start: viewStart, end: viewEnd, label } = useMemo(() => {
    let start, end, label;
    if (view === 'month') {
      start = moment(date).startOf('month').toDate();
      end = moment(date).endOf('month').toDate();
      label = `Month of ${moment(date).format('MMMM')}`;
    } else if (view === 'day') {
      start = moment(date).startOf('day').toDate();
      end = moment(date).endOf('day').toDate();
      label = moment(date).format('MMM D, YYYY');
    } else {
      start = moment(date).startOf('week').toDate();
      end = moment(date).endOf('week').toDate();
      label = `Week of ${moment(start).format('MMM D')}`;
    }
    return { start, end, label };
  }, [view, date]);

  const filteredEvents = events.filter(e =>
      e.start >= viewStart && e.end <= viewEnd
  )

  const totalHours = filteredEvents.reduce((acc, curr) => {
      const duration = (curr.end.getTime() - curr.start.getTime()) / (1000 * 60 * 60)
      return acc + duration
  }, 0)

  const totalPay = filteredEvents.reduce((acc, curr) => {
      const duration = (curr.end.getTime() - curr.start.getTime()) / (1000 * 60 * 60)
      return acc + (duration * curr.hourlyRate)
  }, 0)

  const totalOwed = events.filter(e => !e.isPaid).reduce((acc, curr) => {
      const duration = (curr.end.getTime() - curr.start.getTime()) / (1000 * 60 * 60)
      return acc + (duration * curr.hourlyRate)
  }, 0)

  const markAllAsPaid = async () => {
    const unpaidIds = filteredEvents.filter(e => !e.isPaid && e.id).map(e => e.id)
    
    if (unpaidIds.length === 0) {
        alert("All shifts in this view are already paid!")
        return
    }

    if (!confirm(`Mark ${unpaidIds.length} shifts as paid?`)) return

    await fetch('/api/shifts/bulk', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unpaidIds, data: { isPaid: true } }),
    })

    setEvents(prev => prev.map(e => 
        e.id && unpaidIds.includes(e.id) ? { ...e, isPaid: true } : e
    ))
  }

  // --- Render Helpers ---

  const eventStyleGetter = (event: any) => {
    const shift = event as Shift
    const style = {
      backgroundColor: shift.isPaid ? '#10B981' : '#3B82F6', // Green if paid, Blue if not
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }
    return { style }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Nanny Tracker</h1>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CalendarIcon size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-500">Rate:</span>
              <div className="flex items-center">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={handleRateChange}
                  className="w-12 bg-transparent text-right font-medium focus:outline-none"
                />
                <span className="text-gray-400">/hr</span>
              </div>
            </div>

            <button 
              onClick={markAllAsPaid}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
              title="Mark all visible shifts as paid"
            >
              <Check size={16} />
              Mark Paid
            </button>

            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="mt-4 flex flex-wrap gap-4 md:gap-8 text-sm border-t pt-4">
          <div>
            <span className="text-gray-500 block text-xs uppercase tracking-wide">Current View</span>
            <span className="font-medium text-gray-900">{label}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs uppercase tracking-wide">Hours</span>
            <span className="font-medium text-gray-900">{totalHours.toFixed(2)} hrs</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs uppercase tracking-wide">Period Total</span>
            <span className="font-medium text-gray-900">${totalPay.toFixed(2)}</span>
          </div>
          <div className="ml-auto bg-red-50 px-3 py-1 rounded border border-red-100">
            <span className="text-red-500 block text-xs uppercase tracking-wide font-bold">Total Owed</span>
            <span className="font-bold text-red-600 text-lg">${totalOwed.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        {viewMode === 'calendar' ? (
          <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
              style={{ height: '100%' }}
              onNavigate={(date: Date) => setDate(date)}
              onView={(view: any) => setView(view)}
              eventPropGetter={eventStyleGetter}
            />
          </div>
        ) : (
          <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {events
                .sort((a, b) => b.start.getTime() - a.start.getTime())
                .map(event => {
                  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)
                  const pay = duration * event.hourlyRate
                  
                  return (
                    <div 
                      key={event.id} 
                      onClick={() => handleSelectEvent(event)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`w-2 h-12 rounded-full ${event.isPaid ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <div>
                          <div className="font-medium text-gray-900">
                            {moment(event.start).format('ddd, MMM D')}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Clock size={14} />
                            {moment(event.start).format('h:mm a')} - {moment(event.end).format('h:mm a')}
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                              {duration.toFixed(2)} hrs
                            </span>
                          </div>
                          {event.notes && (
                            <div className="text-xs text-gray-400 mt-1 italic truncate max-w-[200px]">
                              {event.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">${pay.toFixed(2)}</div>
                        <div className={`text-xs font-medium ${event.isPaid ? 'text-green-600' : 'text-blue-600'}`}>
                          {event.isPaid ? 'PAID' : 'OWED'}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {events.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No shifts recorded yet.</div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {selectedShift.id ? 'Edit Shift' : 'New Shift'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={moment(selectedShift.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={e => setSelectedShift({ ...selectedShift, start: new Date(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={moment(selectedShift.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={e => setSelectedShift({ ...selectedShift, end: new Date(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                  value={selectedShift.notes || ''}
                  onChange={e => setSelectedShift({ ...selectedShift, notes: e.target.value })}
                  placeholder="Add details (e.g. late arrival, expenses)..."
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Mark as Paid</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedShift.isPaid}
                    onChange={e => setSelectedShift({ ...selectedShift, isPaid: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
              {selectedShift.id && (
                <button 
                  onClick={deleteShift}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Shift"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <div className="flex-1 flex gap-3 justify-end">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveShift}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Check size={18} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
