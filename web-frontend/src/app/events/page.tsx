'use client';

import { useEffect, useState, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useThemeStore } from '@/lib/stores/theme.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Calendar, MapPin, Clock, Users, Plus, Check, X,
  ChevronLeft, ChevronRight, Repeat, Trash2, Edit2,
} from 'lucide-react';

interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isPublic: boolean;
  maxCapacity: number | null;
  recurrenceGroupId: string | null;
  createdAt: string;
  _count?: { registrations: number };
  isRegistered?: boolean;
}

interface EventForm {
  title: string;
  description: string;
  type: string;
  location: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isPublic: boolean;
  maxCapacity: string;
  recurrence: RecurrenceConfig;
}

interface RecurrenceConfig {
  type: 'none' | 'weekly' | 'custom';
  weekDays: number[];
  weeksCount: number;
  customDates: string[];
}

const EVENT_TYPES: Record<string, string> = {
  SERVICE: 'Service', PRAYER_MEETING: 'Prayer Meeting', BIBLE_STUDY: 'Bible Study',
  YOUTH_EVENT: 'Youth Event', CONFERENCE: 'Conference', WORKSHOP: 'Workshop',
  OUTREACH: 'Outreach', SOCIAL: 'Social', OTHER: 'Other',
};

const TYPE_COLORS: Record<string, string> = {
  SERVICE: '#4F46E5', PRAYER_MEETING: '#8B5CF6', BIBLE_STUDY: '#3B82F6',
  YOUTH_EVENT: '#EC4899', CONFERENCE: '#F59E0B', WORKSHOP: '#10B981',
  OUTREACH: '#EF4444', SOCIAL: '#06B6D4', OTHER: '#6B7280',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

// ─── DateTimePicker ───────────────────────────────────────────────────────────

function DateTimePicker({ value, onChange, label, required, primaryColor }: {
  value: string; onChange: (v: string) => void; label: string;
  required?: boolean; primaryColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? new Date(value) : null;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const selectDay = (day: number) => {
    const h = selected?.getHours() ?? 9;
    const m = selected?.getMinutes() ?? 0;
    onChange(toInputValue(new Date(viewYear, viewMonth, day, h, m)));
  };

  const setTime = (h: number, m: number) => {
    if (!selected) return;
    const d = new Date(selected);
    d.setHours(h, m, 0, 0);
    onChange(toInputValue(d));
  };

  const h = selected?.getHours() ?? 9;
  const m = selected?.getMinutes() ?? 0;
  const display = selected
    ? `${selected.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' })} · ${selected.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`
    : '';

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring text-left"
      >
        <Calendar size={14} className="text-muted-foreground shrink-0" />
        {display ? <span>{display}</span> : <span className="text-muted-foreground">Pick date &amp; time</span>}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 bg-card border border-border rounded-xl shadow-2xl p-4 w-72 left-0">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={14} /></button>
            <span className="text-sm font-semibold text-foreground">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><ChevronRight size={14} /></button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_SHORT.map(d => <div key={d} className="text-center text-xs text-muted-foreground font-medium py-0.5">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`b-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              return (
                <button
                  key={day} type="button" onClick={() => selectDay(day)}
                  className="h-8 w-full text-xs rounded-md transition-colors hover:opacity-70"
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                    color: isSelected ? 'white' : isToday ? primaryColor : undefined,
                    fontWeight: isSelected || isToday ? 600 : undefined,
                  }}
                >{day}</button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
            <Clock size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Time</span>
            <div className="flex items-center gap-1 ml-auto">
              <select value={h} onChange={e => setTime(parseInt(e.target.value), m)}
                className="px-1 py-1 text-xs rounded border border-border bg-background text-foreground">
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{formatHour(i)}</option>)}
              </select>
              <span className="text-muted-foreground text-xs">:</span>
              <select value={m} onChange={e => setTime(h, parseInt(e.target.value))}
                className="px-1 py-1 text-xs rounded border border-border bg-background text-foreground">
                {[0,15,30,45].map(min => <option key={min} value={min}>{pad(min)}</option>)}
              </select>
            </div>
          </div>

          <button type="button" onClick={() => setOpen(false)}
            className="mt-3 w-full py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MultiDatePicker ──────────────────────────────────────────────────────────

function MultiDatePicker({ selectedDates, onChange, primaryColor, anchorDate }: {
  selectedDates: string[]; onChange: (dates: string[]) => void;
  primaryColor: string; anchorDate: string;
}) {
  const anchor = anchorDate ? anchorDate.substring(0, 10) : '';
  const [viewYear, setViewYear] = useState(() => anchor ? new Date(anchor).getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => anchor ? new Date(anchor).getMonth() : new Date().getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const toggleDay = (day: number) => {
    const key = toDateKey(new Date(viewYear, viewMonth, day));
    if (key === anchor) return;
    if (selectedDates.includes(key)) onChange(selectedDates.filter(d => d !== key));
    else onChange([...selectedDates, key].sort());
  };

  return (
    <div className="border border-border rounded-xl p-3 bg-background">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-muted rounded"><ChevronLeft size={13} /></button>
        <span className="text-xs font-semibold text-foreground">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-muted rounded"><ChevronRight size={13} /></button>
      </div>
      <div className="grid grid-cols-7 mb-0.5">
        {DAY_SHORT.map(d => <div key={d} className="text-center text-xs text-muted-foreground py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`b-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = toDateKey(new Date(viewYear, viewMonth, day));
          const isSelected = selectedDates.includes(key) || key === anchor;
          const isPast = key < todayKey && key !== anchor;
          return (
            <button key={day} type="button" onClick={() => !isPast && toggleDay(day)}
              className={`h-7 w-full text-xs rounded-md transition-colors ${isPast && !isSelected ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-70'}`}
              style={{ backgroundColor: isSelected ? primaryColor : undefined, color: isSelected ? 'white' : undefined, fontWeight: key === anchor ? 700 : undefined }}>
              {day}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected · click to toggle
      </p>
    </div>
  );
}

// ─── RecurrencePicker ─────────────────────────────────────────────────────────

function RecurrencePicker({ value, onChange, startDate, primaryColor }: {
  value: RecurrenceConfig; onChange: (v: RecurrenceConfig) => void;
  startDate: string; primaryColor: string;
}) {
  const toggleDay = (day: number) => {
    const days = value.weekDays.includes(day)
      ? value.weekDays.filter(d => d !== day)
      : [...value.weekDays, day].sort();
    onChange({ ...value, weekDays: days });
  };

  const eventCount = value.type === 'weekly'
    ? value.weekDays.length * value.weeksCount
    : value.type === 'custom' ? value.customDates.length : 1;

  return (
    <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
      <div className="flex items-center gap-2">
        <Repeat size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Repeat</span>
        {eventCount > 1 && (
          <span className="ml-auto text-xs text-muted-foreground">{eventCount} events will be created</span>
        )}
      </div>

      <div className="flex gap-1.5">
        {(['none', 'weekly', 'custom'] as const).map(type => (
          <button key={type} type="button" onClick={() => onChange({ ...value, type })}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors"
            style={value.type === type ? { backgroundColor: primaryColor, color: 'white', borderColor: 'transparent' } : undefined}>
            {type === 'none' ? 'No repeat' : type === 'weekly' ? 'Weekly' : 'Custom dates'}
          </button>
        ))}
      </div>

      {value.type === 'weekly' && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Repeat on</p>
            <div className="flex gap-1.5">
              {DAY_SHORT.map((d, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className="w-9 h-9 text-xs font-medium rounded-full border transition-colors"
                  style={value.weekDays.includes(i) ? { backgroundColor: primaryColor, color: 'white', borderColor: 'transparent' } : undefined}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">For</span>
            <input type="number" min="1" max="52" value={value.weeksCount}
              onChange={e => onChange({ ...value, weeksCount: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 px-2 py-1 text-xs text-center rounded-lg border border-border bg-background text-foreground" />
            <span className="text-xs text-muted-foreground">weeks</span>
          </div>
          {value.weekDays.length === 0 && <p className="text-xs text-amber-500">Select at least one day above</p>}
        </div>
      )}

      {value.type === 'custom' && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Click dates to add occurrences. Same time as start will be used for each.</p>
          <MultiDatePicker
            selectedDates={startDate ? Array.from(new Set([startDate.substring(0,10), ...value.customDates])).sort() : value.customDates}
            onChange={dates => onChange({ ...value, customDates: dates })}
            primaryColor={primaryColor}
            anchorDate={startDate}
          />
        </div>
      )}
    </div>
  );
}

// ─── DeleteConfirm overlay ────────────────────────────────────────────────────

function DeleteConfirm({ event, onClose, onConfirm }: {
  event: ChurchEvent; onClose: () => void; onConfirm: (deleteAll: boolean) => void;
}) {
  return (
    <div className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center p-4 text-center gap-3">
      <p className="text-sm font-semibold text-foreground">Delete &ldquo;{event.title}&rdquo;?</p>
      {event.recurrenceGroupId && <p className="text-xs text-muted-foreground">This is part of a recurring series.</p>}
      <div className="flex gap-2 flex-wrap justify-center">
        <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
        <button onClick={() => onConfirm(false)} className="px-3 py-1.5 text-xs rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:opacity-80">
          {event.recurrenceGroupId ? 'This event only' : 'Delete'}
        </button>
        {event.recurrenceGroupId && (
          <button onClick={() => onConfirm(true)} className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:opacity-80">
            Entire series
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Default form ─────────────────────────────────────────────────────────────

const defaultForm = (): EventForm => ({
  title: '', description: '', type: 'SERVICE', location: '',
  startTime: '', endTime: '', isAllDay: false, isPublic: false, maxCapacity: '',
  recurrence: { type: 'none', weekDays: [], weeksCount: 4, customDates: [] },
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { primary } = useThemeStore();
  const userRole = useAuthStore((s) => s.user?.role || '');

  const [items, setItems] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [form, setForm] = useState<EventForm>(defaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canCreate = ['CHURCH_ADMIN','PASTOR','LEADER'].includes(userRole);
  const canManage = ['CHURCH_ADMIN','PASTOR','LEADER'].includes(userRole);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events?limit=100&sortBy=startTime&sortOrder=asc');
      setItems(data.data?.data || []);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => {
    setEditingEvent(null); setForm(defaultForm()); setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const closeForm = () => { setShowForm(false); setEditingEvent(null); setForm(defaultForm()); };

  const handleEdit = (event: ChurchEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title, description: event.description, type: event.type,
      location: event.location || '', startTime: toInputValue(new Date(event.startTime)),
      endTime: toInputValue(new Date(event.endTime)), isAllDay: event.isAllDay,
      isPublic: event.isPublic, maxCapacity: event.maxCapacity ? String(event.maxCapacity) : '',
      recurrence: { type: 'none', weekDays: [], weeksCount: 4, customDates: [] },
    });
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleDelete = async (event: ChurchEvent, deleteAll: boolean) => {
    setConfirmDeleteId(null);
    try {
      if (deleteAll && event.recurrenceGroupId) {
        await api.delete(`/events/series/${event.recurrenceGroupId}`);
        toast.success('Series deleted');
      } else {
        await api.delete(`/events/${event.id}`);
        toast.success('Event deleted');
      }
      fetchEvents();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to delete'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startTime || !form.endTime) { toast.error('Please select start and end times'); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) { toast.error('End time must be after start time'); return; }
    if (form.recurrence.type === 'weekly' && form.recurrence.weekDays.length === 0) { toast.error('Select at least one day'); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title, description: form.description, type: form.type,
        location: form.location || null,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        isAllDay: form.isAllDay, isPublic: form.isPublic,
        maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
        recurrence: form.recurrence.type !== 'none' ? form.recurrence : undefined,
      };

      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, payload);
        toast.success('Event updated');
      } else {
        const { data } = await api.post('/events', payload);
        const count = data.data?.seriesCount;
        toast.success(count > 1 ? `Created ${count} events` : 'Event created');
      }
      closeForm(); fetchEvents();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to save event'); }
    finally { setSubmitting(false); }
  };

  const handleRegister = async (eventId: string) => {
    try { await api.post(`/events/${eventId}/register`); toast.success('Registered!'); fetchEvents(); }
    catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to register'); }
  };

  const handleUnregister = async (eventId: string) => {
    try { await api.delete(`/events/${eventId}/register`); toast.success('Unregistered'); fetchEvents(); }
    catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to unregister'); }
  };

  const submitLabel = () => {
    if (submitting) return 'Saving…';
    if (editingEvent) return 'Update Event';
    if (form.recurrence.type === 'weekly' && form.recurrence.weekDays.length > 0)
      return `Create ${form.recurrence.weekDays.length * form.recurrence.weeksCount} Events`;
    if (form.recurrence.type === 'custom' && form.recurrence.customDates.length > 0)
      return `Create ${form.recurrence.customDates.length} Events`;
    return 'Create Event';
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";
  const labelCls = "block text-sm font-medium text-foreground mb-1";

  const grouped: { label: string; events: ChurchEvent[] }[] = [];
  items.forEach(event => {
    const label = new Date(event.startTime).toLocaleDateString('en-US', { month:'long', year:'numeric' });
    const last = grouped[grouped.length - 1];
    if (last?.label === label) last.events.push(event);
    else grouped.push({ label, events: [event] });
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} upcoming event{items.length !== 1 ? 's' : ''}</p>
        </div>
        {canCreate && (
          <button onClick={showForm ? closeForm : openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary }}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New Event'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-sm p-6 mb-8 space-y-4">
          <h3 className="font-semibold text-foreground text-lg">
            {editingEvent ? `Editing: ${editingEvent.title}` : 'Create New Event'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title <span className="text-red-500">*</span></label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Sunday Service" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                {Object.entries(EVENT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description <span className="text-red-500">*</span></label>
            <textarea required rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Join us for worship and fellowship…" className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Location</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Main Sanctuary" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateTimePicker value={form.startTime} label="Start" required primaryColor={primary}
              onChange={v => setForm(f => ({
                ...f, startTime: v,
                endTime: !f.endTime ? toInputValue(new Date(new Date(v).getTime() + 60*60*1000)) : f.endTime,
              }))} />
            <DateTimePicker value={form.endTime} label="End" required primaryColor={primary}
              onChange={v => setForm(f => ({ ...f, endTime: v }))} />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={form.isAllDay} onChange={e => setForm(f => ({ ...f, isAllDay: e.target.checked }))} className="rounded" />
              All Day
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} className="rounded" />
              Public Event
            </label>
            <div className="ml-auto flex items-center gap-2">
              <Users size={14} className="text-muted-foreground" />
              <input type="number" min="1" value={form.maxCapacity}
                onChange={e => setForm(f => ({ ...f, maxCapacity: e.target.value }))}
                placeholder="No capacity limit"
                className="w-40 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
            </div>
          </div>

          {!editingEvent && (
            <RecurrencePicker value={form.recurrence}
              onChange={recurrence => setForm(f => ({ ...f, recurrence }))}
              startDate={form.startTime} primaryColor={primary} />
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary }}>
              {submitLabel()}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-16 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-14 text-center">
          <Calendar size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-medium text-foreground mb-1">No events scheduled</p>
          <p className="text-sm text-muted-foreground">{canCreate ? 'Create your first event above.' : 'Check back soon!'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ label, events }) => (
            <div key={label}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">{label}</h2>
              <div className="space-y-3">
                {events.map(event => {
                  const regCount = event._count?.registrations ?? 0;
                  const isFull = !!event.maxCapacity && regCount >= event.maxCapacity;
                  const color = TYPE_COLORS[event.type] || '#6B7280';
                  const startDt = new Date(event.startTime);

                  return (
                    <div key={event.id} className="relative bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                      <div className="h-1 w-full" style={{ backgroundColor: color }} />
                      <div className="p-4 flex items-start gap-4">
                        <div className="shrink-0 w-14 rounded-lg overflow-hidden text-center text-white" style={{ backgroundColor: color }}>
                          <div className="text-xs font-medium uppercase py-0.5 opacity-80">
                            {startDt.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-2xl font-bold pb-1 leading-none">{startDt.getDate()}</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                              {EVENT_TYPES[event.type] || event.type}
                            </span>
                            {event.isPublic && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Public</span>}
                            {event.recurrenceGroupId && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                                <Repeat size={9} /> Recurring
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {event.isAllDay ? 'All day'
                                : `${startDt.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })} – ${new Date(event.endTime).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}`}
                            </span>
                            {event.location && <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>}
                            {event.maxCapacity && (
                              <span className={`flex items-center gap-1 ${isFull ? 'text-red-500 font-medium' : ''}`}>
                                <Users size={11} />{regCount}/{event.maxCapacity}{isFull ? ' · Full' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {canManage && (
                            <>
                              <button onClick={() => handleEdit(event)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => setConfirmDeleteId(event.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 transition-colors text-muted-foreground hover:text-red-600" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => event.isRegistered ? handleUnregister(event.id) : handleRegister(event.id)}
                            disabled={!event.isRegistered && isFull}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              event.isRegistered
                                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200'
                                : 'bg-muted hover:bg-muted/60 text-foreground'
                            }`}>
                            {event.isRegistered ? <Check size={12} /> : <Plus size={12} />}
                            {event.isRegistered ? 'Registered' : isFull ? 'Full' : 'Register'}
                          </button>
                        </div>
                      </div>

                      {confirmDeleteId === event.id && (
                        <DeleteConfirm event={event} onClose={() => setConfirmDeleteId(null)}
                          onConfirm={(deleteAll) => handleDelete(event, deleteAll)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}