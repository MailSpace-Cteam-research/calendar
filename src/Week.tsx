// Недельная сетка, слой занятости и вид «По людям» — в VKUI аналогов нет, поэтому свои; кликабельные области на Tappable
import { useEffect, useRef, useState } from 'react';
import { Avatar, Footnote, SegmentedControl, Tappable } from '@vkontakte/vkui';
import { Icon20BuildingOutline } from '@vkontakte/icons';
import {
  BUSY, DATES, DAYS, H0, H1, RH, ROOMS, OWN0, busyNames, fmt, grad, ownerBusy,
  type Ev, type Form, type Slot,
} from './data';

type WeekProps = {
  form: Form | null; part: Ev | null; events: Ev[]; cal: Ev[]; slotList: Slot[]; hover: number | null;
  onCreate: (d: number, h: number) => void; onOutside: () => void; onMove: (d: number, h: number) => void; anna: boolean; figma?: boolean;
};

const FIGMA_WEEK_EVENTS: Ev[] = [
  { d: 0, s: 11, e: 11.5, t: 'Еженедельная планёрка' },
  { d: 0, s: 13, e: 14, t: 'Обсуждение почты' },
  { d: 0, s: 14, e: 14.5, t: 'Карточка контакта' },
  { d: 1, s: 10, e: 11, t: 'Обновить документацию' },
  { d: 1, s: 12, e: 12.5, t: 'Улучшаем NPS нашего сервиса' },
  { d: 1, s: 13, e: 13.5, t: 'Заметки. Возвращение' },
  { d: 2, s: 11, e: 11.5, t: 'Обсудить аттачи' },
  { d: 2, s: 12, e: 14, t: 'Design & Product review Productivity' },
  { d: 2, s: 14, e: 15, t: 'Подготовить воркшоп', c: 'g' },
  { d: 2, s: 15, e: 15.5, t: 'Обсуждение почты' },
  { d: 3, s: 11, e: 12, t: 'Воркшоп Lottie', c: 'g' },
  { d: 3, s: 12, e: 13, t: 'Задачи' },
  { d: 4, s: 11, e: 12, t: 'Улучшаем NPS нашего сервиса' },
  { d: 4, s: 13, e: 14, t: 'Демо Почты' },
  { d: 4, s: 14, e: 15, t: 'Демо Облака' },
];

export function Week({ form: f, part, events, cal, slotList, hover, onCreate, onOutside, onMove, anna, figma = false }: WeekProps) {
  const gridEnd = figma ? 21 : H1;
  const gridRowHeight = figma ? 56 : RH;
  const displayDays = figma ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : DAYS;
  const displayDates = figma ? [6, 7, 8, 9, 10, 11, 12] : DATES;
  const displayEvents = figma
    ? [...FIGMA_WEEK_EVENTS, ...events.filter((e) => !OWN0.some((original) => original.t === e.t && original.d === e.d && original.s === e.s))]
    : events;
  const hours: number[] = []; for (let h = H0; h < gridEnd; h++) hours.push(h);
  const halves: number[] = []; for (let h = H0; h < (figma ? H1 : gridEnd); h += 0.5) halves.push(h);
  const side = f && f.mode === 'side';
  const heat = !!(side && f!.people.length >= 6);
  const [drag, setDrag] = useState<{ d: number; h: number } | null>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!drag || !f) return;
    const move = (e: PointerEvent) => {
      const i = cols.current.findIndex((c) => { if (!c) return false; const r = c.getBoundingClientRect(); return e.clientX >= r.left && e.clientX < r.right; });
      if (i < 0) return;
      if (i > 4) return;
      const r = cols.current[i]!.getBoundingClientRect();
      let h = H0 + Math.round(((e.clientY - r.top) / gridRowHeight - f.len / 2) * 2) / 2;
      h = Math.max(H0, Math.min(H1 - f.len, h));
      setDrag({ d: i, h });
    };
    const up = () => { setDrag((cur) => { if (cur) onMove(cur.d, cur.h); return null; }); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [!!drag]); // eslint-disable-line

  const dd = drag ? drag.d : f?.d, ds = drag ? drag.h : f?.s;
  const conf = f ? (busyNames(f, dd!, ds!, ds! + f.len).length > 0 || !!ownerBusy(cal, dd!, ds!, ds! + f.len)) : false;

  return (
    <div className="week">
      <div />
      {displayDays.map((d, i) => (
        <div key={d} className={'dh' + (i === (figma ? 1 : 2) ? ' today' : '') + (i >= 5 ? ' weekend' : '')}><b>{displayDates[i]}</b>{d}</div>
      ))}
      <div className="tcol" style={{ height: (gridEnd - H0) * gridRowHeight }}>
        {hours.map((h) => <span key={h} style={{ top: (h - H0) * gridRowHeight }}>{h}:00</span>)}
      </div>
      {displayDays.map((_, d) => (
        <div key={d} className={'dcol' + (d >= 5 ? ' weekend' : '')} ref={(el) => { cols.current[d] = el; }} style={{ height: (gridEnd - H0) * gridRowHeight }}>
          {hours.slice(1).map((h) => <div key={h} className="hl" style={{ top: (h - H0) * gridRowHeight }} />)}
          {heat && halves.map((x) => {
            const bn = busyNames(f!, d, x, x + 0.5), N = f!.people.length, fr = N - bn.length, r = fr / N;
            const col = r >= 1 ? 'var(--vkui--color_background_positive)' : r >= 0.9 ? 'var(--vkui--color_background_warning)' : 'var(--vkui--color_background_negative)';
            return (
              <div key={x} className={'heat' + (r < 0.9 ? ' bad' : '')} title={bn.length ? 'Заняты: ' + bn.join(', ') : 'Свободны все'}
                style={{ top: (x - H0) * gridRowHeight, height: gridRowHeight / 2, backgroundColor: `color-mix(in srgb, ${col} ${r >= 1 ? 14 : r >= 0.9 ? 18 : 22}%, transparent)` }}>
                {r < 1 && <span>{fr}/{N}</span>}
              </div>
            );
          })}
          {displayEvents.filter((x) => x.d === d).map((x, i) => (
            <div key={i} className={'ev ' + (x.c || '')} style={{ top: (x.s - H0) * gridRowHeight + 1, height: (x.e - x.s) * gridRowHeight - 2 }}>
              {x.t}{x.e - x.s >= 1 && <small>{fmt(x.s)}–{fmt(x.e)}</small>}
            </div>
          ))}
          {side && !heat && f!.people.length > 0 && segments(f!, d).map((sg, i) => (
            <div key={i} className="ov" title={'Заняты: ' + sg.n} style={{ top: (sg.s - H0) * gridRowHeight + 1, height: (sg.e - sg.s) * gridRowHeight - 2 }}><b>{sg.n}</b></div>
          ))}
          {d < 5 && !f && !part && halves.map((x) => (
            <Tappable key={x} className="cell" style={{ top: (x - H0) * gridRowHeight, height: gridRowHeight / 2 }} activeMode="opacity" hoverMode="background"
              aria-label={`Создать: ${DAYS[d]} ${fmt(x)}`} onClick={() => onCreate(d, Math.min(x, H1 - 1))} />
          ))}
          {d < 5 && f && f.mode === 'pop' && halves.map((x) => (
            <Tappable key={x} className="cell" style={{ top: (x - H0) * gridRowHeight, height: gridRowHeight / 2 }} hoverMode="background" aria-label="Закрыть форму" onClick={onOutside} />
          ))}
          {f && hover != null && slotList[hover] && slotList[hover].d === d && !(slotList[hover].d === f.d && slotList[hover].s === f.s) && (
            <div className="ghost" style={{ top: (slotList[hover].s - H0) * gridRowHeight + 1, height: f.len * gridRowHeight - 2 }}>{fmt(slotList[hover].s)} · сюда переедет событие</div>
          )}
          {f && dd === d && (
            <div id="draft" className={'draft' + (anna ? ' anna' : '') + (conf ? ' conf' : '') + (drag ? ' dragging' : '')}
              style={{ top: (ds! - H0) * gridRowHeight + 1, height: f.len * gridRowHeight - 2 }}
              onPointerDown={(e) => { e.preventDefault(); setDrag({ d: f.d, h: f.s }); }}>
              <span id="dtitle">{f.title || 'Новое событие'}</span><small>{fmt(ds!)}–{fmt(ds! + f.len)}</small>
            </div>
          )}
          {part && part.d === d && (
            <div className="draft" style={{ top: (part.s - H0) * gridRowHeight + 1, height: (part.e - part.s) * gridRowHeight - 2 }}>{part.t}<small>{fmt(part.s)}–{fmt(part.e)}</small></div>
          )}
        </div>
      ))}
    </div>
  );
}

function segments(f: Form, d: number) {
  const out: { s: number; e: number; n: string }[] = [];
  let seg: { s: number; e: number; n: string } | null = null;
  for (let x = H0; x < H1; x += 0.5) {
    const bn = busyNames(f, d, x, x + 0.5).join(', ');
    if (bn && seg && seg.n === bn) seg.e = x + 0.5;
    else { if (seg) out.push(seg); seg = bn ? { s: x, e: x + 0.5, n: bn } : null; }
  }
  if (seg) out.push(seg);
  return out;
}

export function WeekLegend({ f, anna }: { f: Form | null; anna: boolean }) {
  if (!f) return null;
  const items: React.ReactNode[] = [];
  if (anna) items.push(<span key="a"><i style={{ background: 'var(--owner)' }} />Анна Смирнова</span>, <span key="o"><i style={{ border: '1px dashed var(--owner2)' }} />Олег Ким</span>, <span key="m"><i style={{ background: 'color-mix(in srgb, var(--vkui--color_background_accent) 16%, var(--vkui--color_background_content))' }} />мой календарь</span>);
  if (f.mode === 'pop') items.push(<span key="p">Перенести — перетащите блок или выберите слот. {f.people.length || f.ext.length ? 'Наведите на слот — он подсветится на неделе. ' : ''}Клик мимо формы закрывает её, черновик сохраняется.</span>);
  else if (f.people.length >= 6) items.push(<span key="h1"><i style={{ background: 'var(--vkui--color_background_positive)', opacity: 0.5 }} />свободны все</span>, <span key="h2"><i style={{ background: 'var(--vkui--color_background_warning)', opacity: 0.6 }} />нет одного</span>, <span key="h3"><i style={{ background: 'var(--vkui--color_background_negative)', opacity: 0.6 }} />нет двух и больше, со штриховкой</span>, <span key="h4">«11/12» — сколько свободны; наведите — кто занят</span>, <span key="h5">перетащите блок, чтобы перенести</span>);
  else if (f.people.length) items.push(<span key="b"><i className="hatch" />занятость участников</span>, <span key="d">перетащите блок, чтобы перенести</span>);
  return <Footnote className="legend">{items}</Footnote>;
}

export function PeopleView({ f, day, cal, onDay, onPick }: { f: Form; day: number; cal: Ev[]; onDay: (d: number) => void; onPick: (h: number) => void }) {
  const pct = (h: number) => ((h - H0) / (H1 - H0)) * 100 + '%';
  const hours: number[] = []; for (let x = H0; x <= H1; x++) hours.push(x);
  const halves: number[] = []; for (let x = H0; x < H1; x += 0.5) halves.push(x);
  const Bar = ({ iv, ev, nodata }: { iv: number[][]; ev?: boolean; nodata?: boolean }) => (
    <div className="bar">
      {nodata ? <span className="nodata">нет данных о занятости</span> : iv.map((b, i) => <i key={i} className={ev ? 'e' : ''} style={{ left: pct(b[0]), width: ((b[1] - b[0]) / (H1 - H0)) * 100 + '%' }} />)}
      {halves.map((x) => <Tappable key={x} className="pick" hoverMode="background" style={{ left: pct(x), width: 50 / (H1 - H0) + '%' }} aria-label={fmt(x)} onClick={() => onPick(x)} />)}
      {f.d === day && <span className="sel" style={{ left: pct(f.s), width: (f.len / (H1 - H0)) * 100 + '%' }} />}
    </div>
  );
  const anna = f.owner === 'anna';
  return (
    <div>
      <div className="pvtop">
        <SegmentedControl size="m" value={day} onChange={(v) => onDay(Number(v))} options={DAYS.map((x, i) => ({ value: i, label: `${x} ${DATES[i]}` }))} />
        <Footnote className="muted">Кликните в строку — событие встанет на это время</Footnote>
      </div>
      <div className="pv">
        <span />
        <div className="hours">{hours.map((x) => <span key={x} style={{ left: pct(x) }}>{x}</span>)}</div>
        <span className="nm"><Avatar size={24} initials={anna ? 'А' : 'В'} gradientColor={anna ? 5 : 1} />{anna ? 'Анна Смирнова' : 'Вы'}</span>
        <Bar iv={cal.filter((x) => x.d === day).map((x) => [x.s, x.e])} ev />
        {f.people.map((p) => (
          <FragmentRow key={p} name={p}><Bar iv={(BUSY[p] || []).filter((b) => b[0] === day).map((b) => [b[1], b[2]])} /></FragmentRow>
        ))}
        {f.ext.map((p) => <FragmentRow key={p} name={p}><Bar iv={[]} nodata /></FragmentRow>)}
        {f.room && (<>
          <Footnote className="sec" caps weight="2">Переговорки</Footnote>
          {ROOMS.map((r) => (
            <FragmentRow key={r.n} name={`${r.n} · ${r.cap} мест`} icon><Bar iv={r.busy.filter((b) => b[0] === day).map((b) => [b[1], b[2]])} /></FragmentRow>
          ))}
        </>)}
      </div>
    </div>
  );
}
function FragmentRow({ name, icon, children }: { name: string; icon?: boolean; children: React.ReactNode }) {
  return (<>
    <span className="nm">{icon ? <Icon20BuildingOutline className="muted" /> : <Avatar size={24} initials={name[0].toUpperCase()} gradientColor={grad(name)} />}{name}</span>
    {children}
  </>);
}
