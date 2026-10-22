import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, dayUtc, initials } from "@/lib/admin-workspace";
import type { ReservationEvent } from "@/lib/reservation-calendar";
import { Button } from "@/components/ui/button";
export function ReservationCalendar({
  events,
  onSelect,
}: {
  events: ReservationEvent[];
  onSelect: (event: ReservationEvent) => void;
}) {
  const today = dayUtc();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [expanded, setExpanded] = useState("");
  const first = `${month}-01`;
  const start = addDays(first, -((new Date(first + "T00:00:00Z").getUTCDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const move = (offset: number) => {
    const date = new Date(first + "T00:00:00Z");
    date.setUTCMonth(date.getUTCMonth() + offset);
    setMonth(dayUtc(date).slice(0, 7));
    setExpanded("");
  };
  return (
    <section aria-label="Confirmed booking calendar" className="admin-confirmed-calendar">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label>
          <span className="sr-only">Calendar month</span>
          <input
            type="month"
            min="2000-01"
            max="2100-12"
            className="bg-transparent text-lg font-medium"
            value={month}
            onChange={(e) => {
              if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value);
            }}
          />
        </label>
        <div className="flex gap-2">
          <Button variant="outline" aria-label="Previous month" onClick={() => move(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" onClick={() => setMonth(today.slice(0, 7))}>
            Today
          </Button>
          <Button variant="outline" aria-label="Next month" onClick={() => move(1)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      <div className="admin-calendar-scroll">
        <div className="admin-calendar-inner">
          <div className="grid grid-cols-7">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day} className="admin-calendar-weekday">
                {day}
              </span>
            ))}
          </div>
          <div className="admin-calendar-grid">
            {days.map((date) => {
              const bookings = events.filter(
                (event) => event.startsOn <= date && event.endsOn >= date,
              );
              const shown = expanded === date ? bookings : bookings.slice(0, 3);
              return (
                <div
                  key={date}
                  className={`admin-calendar-cell ${date === today ? "is-today" : ""} ${!date.startsWith(month) ? "is-outside-month" : ""}`}
                >
                  <span className="admin-calendar-day">{Number(date.slice(-2))}</span>
                  {shown.map((event) => (
                    <button
                      key={`${event.kind}-${event.id}`}
                      className="admin-calendar-item confirmed"
                      aria-label={`${event.name} — ${event.title} on ${date}`}
                      title={`${event.name} · ${event.title}`}
                      onClick={() => onSelect(event)}
                    >
                      <span className="reservation-initials" aria-hidden="true">
                        {initials(event.name)}
                      </span>
                      <span className="calendar-traveller-name">{event.name}</span>
                    </button>
                  ))}
                  {bookings.length > 3 && (
                    <button
                      className="mt-2 text-xs text-primary"
                      onClick={() => setExpanded(expanded === date ? "" : date)}
                    >
                      {expanded === date ? "Show fewer" : `+${bookings.length - 3} more`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {!events.some((event) => event.startsOn <= days[41]! && event.endsOn >= days[0]!) && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          No confirmed bookings this month.
        </p>
      )}
    </section>
  );
}
