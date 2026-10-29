// Недельная сетка из макета: шапка дней, события на весь день, часы, события, линия «сейчас».
// События перетаскиваются (перенос по времени и дням) и растягиваются за верхний и нижний край с шагом 15 минут.
import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { Icon16Attach, Icon16VideocamOutline } from '@vkontakte/icons';
import {
  ALL_DAY, GRADIENTS, HOUR, NOW, START_HOUR, STEP, WEEK, durationText, fmt,
  type CalEvent, type EventColor,
} from './weekData';

type Mode = 'move' | 'top' | 'bottom';
type Drag = { id: string; mode: Mode; x0: number; y0: number; orig: CalEvent; day: number; s: number; e: number; moved: boolean };

export type SlotInfo = { day: number; h: number };

/** Отступы события внутри колонки по макету: 2px сверху и слева, 13px справа; снизу 2px у часовых и длиннее, 0 у коротких */
const INSET = { top: 2, left: 2, right: 13 };
const EDGE = 6;

const colorVars = (c: EventColor): CSSProperties => ({
  ['--ev-bg' as string]: `color-mix(in srgb, var(--vkui--calendar_color_event_${c}) 90%, transparent)`,
  ['--ev-solid' as string]: `var(--vkui--calendar_color_event_${c})`,
  ['--ev-text' as string]: `var(--vkui--calendar_color_event_text_${c})`,
  ['--ev-tint' as string]: `var(--vkui--calendar_color_background_${c}_tint)`,
});

// по макету: 60 мин — 52px, 30 мин — 26px, 15 мин — 12px
const evHeight = (s: number, e: number) => (e - s) * HOUR - (e - s >= 1 ? 4 : 2);

function EventBody({ ev, h }: { ev: CalEvent; h: number }) {
  const icons = (ev.attach || ev.call) && (
    <span className="ev__icons">
      {ev.attach && <Icon16Attach aria-label="Есть вложение" />}
      {ev.call && <Icon16VideocamOutline aria-label="Есть ссылка на встречу" />}
    </span>
  );
  if (h < 44) return <span className="ev__title ev__title--line">{ev.title}</span>;
  // заголовок занимает всё, что осталось над строкой времени
  const lines = Math.max(1, Math.floor((h - 8 - 18) / 18));
  return (
    <>
      <span className="ev__title" style={{ WebkitLineClamp: lines }}>{ev.title}</span>
      <span className="ev__time"><span>{fmt(ev.s)} — {fmt(ev.e)}</span>{icons}</span>
    </>
  );
}

export function WeekGrid({
  events, onChange, selected, onSelect, onSlotClick, overlay,
}: {
  events: CalEvent[];
  onChange: (next: CalEvent[]) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** клик в пустое место сетки — точка входа для вариантов создания события */
  onSlotClick?: (slot: SlotInfo, e: RPointerEvent) => void;
  /** слой поверх сетки (поповер, черновик события и т. п.) */
  overlay?: ReactNode;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);

  useLayoutEffect(() => { if (scroll.current) scroll.current.scrollTop = START_HOUR * HOUR; }, []);

  const dayAt = (x: number, fallback: number) => {
    const i = cols.current.findIndex((c) => { if (!c) return false; const r = c.getBoundingClientRect(); return x >= r.left && x < r.right; });
    return i < 0 ? fallback : i;
  };

  const down = (ev: CalEvent) => (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect(), y = e.clientY - r.top;
    const mode: Mode = r.height >= 26 && y < EDGE ? 'top' : r.height >= 26 && y > r.height - EDGE ? 'bottom' : 'move';
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: ev.id, mode, x0: e.clientX, y0: e.clientY, orig: ev, day: ev.day, s: ev.s, e: ev.e, moved: false });
  };

  const move = (e: RPointerEvent) => {
    if (!drag) return;
    const dh = Math.round((e.clientY - drag.y0) / HOUR / STEP) * STEP;
    const moved = drag.moved || Math.abs(e.clientY - drag.y0) > 3 || Math.abs(e.clientX - drag.x0) > 3;
    const { orig } = drag;
    let { day, s, e: end } = orig;
    if (drag.mode === 'move') {
      const len = orig.e - orig.s;
      s = Math.min(Math.max(orig.s + dh, 0), 24 - len); end = s + len; day = dayAt(e.clientX, drag.day);
    } else if (drag.mode === 'top') s = Math.min(Math.max(orig.s + dh, 0), orig.e - STEP);
    else end = Math.max(Math.min(orig.e + dh, 24), orig.s + STEP);
    if (moved !== drag.moved || day !== drag.day || s !== drag.s || end !== drag.e) setDrag({ ...drag, moved, day, s, e: end });
  };

  const up = () => {
    if (!drag) return;
    if (drag.moved) {
      const { day, s, e } = drag;
      if (day !== drag.orig.day || s !== drag.orig.s || e !== drag.orig.e) onChange(events.map((x) => (x.id === drag.id ? { ...x, day, s, e } : x)));
      onSelect(drag.id);
    } else onSelect(selected === drag.id ? null : drag.id);
    setDrag(null);
  };

  const slotDown = (day: number) => (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag) return;
    const r = e.currentTarget.getBoundingClientRect();
    const h = Math.floor((e.clientY - r.top) / HOUR / STEP) * STEP;
    onSelect(null);
    onSlotClick?.({ day, h }, e);
  };

  const ghost = drag && drag.moved ? drag : null;

  return (
    <div className="cal-week">
      <div className="cal-week__head">
        <div className="cal-week__gutter" />
        {WEEK.dates.map((d, i) => {
          const all = ALL_DAY.find((a) => a.day === i);
          const past = i < WEEK.today;
          return (
            <div key={d} className={'cal-dayhead' + colClass(i) + (i === WEEK.today ? ' is-today' : '') + (past ? ' is-past' : '')}>
              <div className="cal-dayhead__date">
                <span className="cal-dayhead__num">{d}</span>
                <span className="cal-dayhead__wd">{WEEK.weekdays[i]}</span>
              </div>
              <div className="cal-allday">
                {all && (
                  <>
                    <div className={'cal-allday__ev' + (past ? ' is-past' : '')} style={colorVars(all.color)}>{all.title}</div>
                    {all.more && <div className={'cal-allday__more' + (past ? ' is-past' : '')} style={colorVars(all.color)}>+{all.more}</div>}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cal-week__body" ref={scroll}>
        <div className="cal-week__inner" onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)}>
          <div className="cal-timeline">
            {Array.from({ length: 24 }, (_, h) => <div key={h} className="cal-timeline__label" style={{ top: h * HOUR - 10 }}>{fmt(h)}</div>)}
          </div>
          {WEEK.dates.map((d, i) => (
            <div key={d} ref={(el) => { cols.current[i] = el; }} className={'cal-col' + colClass(i)} onPointerDown={slotDown(i)}>
              {ghost && ghost.day === i && (() => {
                const box = { ...colorVars(ghost.orig.color), top: ghost.s * HOUR + INSET.top, height: evHeight(ghost.s, ghost.e) };
                return (
                  <>
                    <div className="ev-ghost" style={box} />
                    {/* ручка и подсказка — над соседними событиями, сам «призрак» — под исходным */}
                    {ghost.mode !== 'move' && (
                      <div className="ev-ghost-ui" style={box}>
                        <span className={'ev-ghost__handle ev-ghost__handle--' + ghost.mode} />
                        <div className={'cal-tip cal-tip--' + ghost.mode}>{durationText(ghost.e - ghost.s)}</div>
                      </div>
                    )}
                  </>
                );
              })()}
              {events.filter((ev) => ev.day === i).map((ev) => {
                const h = evHeight(ev.s, ev.e);
                const cls = ['ev', `ev--${ev.status}`];
                if (i < WEEK.today) cls.push('ev--past');
                if (h < 26) cls.push('ev--small');
                if (selected === ev.id || drag?.id === ev.id) cls.push('ev--active');
                if (drag?.id === ev.id && drag.moved) cls.push(drag.mode === 'move' ? 'is-moving' : 'is-resizing');
                const style: CSSProperties = { ...colorVars(ev.color), top: ev.s * HOUR + INSET.top, height: h };
                if (ev.gradient && ev.status === 'accepted' && i >= WEEK.today) style['--ev-bg' as string] = GRADIENTS[ev.gradient];
                return (
                  <div key={ev.id} className={'ev-wrap' + (ev.mark ? ' has-mark' : '')} style={style} onPointerDown={down(ev)}>
                    {ev.mark && <span className="ev__mark" />}
                    <div className={cls.join(' ')} title={`${ev.title}, ${fmt(ev.s)} — ${fmt(ev.e)}`}>
                      <EventBody ev={ev} h={h} />
                    </div>
                  </div>
                );
              })}
              {i === NOW.day && <div className="cal-now" style={{ top: NOW.h * HOUR - 1 }} />}
            </div>
          ))}
          {overlay}
        </div>
      </div>
    </div>
  );
}

const colClass = (i: number) => (i === WEEK.today ? ' cal-col--today' : i >= 5 ? ' cal-col--weekend' : '');
