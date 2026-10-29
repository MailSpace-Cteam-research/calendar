// Основа Календаря по макету Figma «Неделя» (1366×820). Поверх неё наслаиваются варианты создания события:
// они получают клик по пустому слоту (onSlotClick), кнопку «Новое событие» (onCreate) и слой overlay над сеткой.
import { useEffect, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { GridNav, NavBar, Sidebar } from './Chrome';
import { WeekGrid, type SlotInfo } from './WeekGrid';
import { EVENTS, type CalEvent } from './weekData';
import './calendar.css';

export type CalendarProps = {
  onSlotClick?: (slot: SlotInfo, e: RPointerEvent) => void;
  onCreate?: () => void;
  overlay?: ReactNode;
  /** события можно держать снаружи, если варианту нужно добавлять свои */
  events?: CalEvent[];
  onEventsChange?: (next: CalEvent[]) => void;
};

export default function Calendar({ onSlotClick, onCreate, overlay, events: outer, onEventsChange }: CalendarProps) {
  const [inner, setInner] = useState<CalEvent[]>(EVENTS);
  const [selected, setSelected] = useState<string | null>('w2');
  const events = outer ?? inner;
  const setEvents = onEventsChange ?? setInner;

  useEffect(() => {
    document.documentElement.classList.add('cal-page');
    return () => document.documentElement.classList.remove('cal-page');
  }, []);

  return (
    <div className="cal">
      <NavBar />
      <div className="cal__content">
        <Sidebar onCreate={onCreate} />
        <main className="cal__area">
          <GridNav />
          <WeekGrid events={events} onChange={setEvents} selected={selected} onSelect={setSelected} onSlotClick={onSlotClick} overlay={overlay} />
        </main>
      </div>
    </div>
  );
}
