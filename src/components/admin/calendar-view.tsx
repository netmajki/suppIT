"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import plLocale from "@fullcalendar/core/locales/pl";
import deLocale from "@fullcalendar/core/locales/de";
import enLocale from "@fullcalendar/core/locales/en-gb";
import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { ExternalLink, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deleteEvent, moveCalendarItem, saveEvent } from "@/lib/actions/calendar";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { FormAlert } from "@/components/admin/form-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fcLocales = { pl: plLocale, de: deLocale, en: enLocale };

type Option = { id: string; label: string };
type Draft = {
  id?: string;
  title: string;
  description: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  orderId: string;
  userId: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date | null, allDay: boolean) =>
  d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}${allDay ? "" : `T${pad(d.getHours())}:${pad(d.getMinutes())}`}` : "";
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());

export function CalendarView({ orders, staff, currentUserId }: { orders: Option[]; staff: Option[]; currentUserId: string }) {
  const t = useTranslations("Calendar");
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const locale = useLocale() as keyof typeof fcLocales;
  const router = useRouter();
  const calRef = useRef<FullCalendar>(null);
  const [mine, setMine] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [allDay, setAllDay] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [state, formAction] = useActionState(saveEvent, {});

  const refetch = () => calRef.current?.getApi().refetchEvents();

  // Po udanym zapisie zamknij okno i odśwież kalendarz
  useEffect(() => {
    if (state.ok) {
      setDraft(null);
      refetch();
    }
  }, [state]);

  useEffect(() => {
    refetch();
  }, [mine]);

  const openDraft = (d: Draft) => {
    setAllDay(d.allDay);
    setDraft(d);
  };

  const onSelect = (arg: DateSelectArg) => {
    // FullCalendar: koniec całodniowy jest wyłączny → pokazujemy dzień wcześniej
    const end = arg.allDay ? addDays(arg.end, -1) : arg.end;
    openDraft({ title: "", description: "", start: arg.start, end, allDay: arg.allDay, orderId: "", userId: currentUserId });
    arg.view.calendar.unselect();
  };

  const onClick = (arg: EventClickArg) => {
    const p = arg.event.extendedProps as Record<string, string>;
    if (p.kind !== "event") {
      router.push(`/admin/orders/${p.orderId}`);
      return;
    }
    const end = arg.event.end ? (arg.event.allDay ? addDays(arg.event.end, -1) : arg.event.end) : null;
    openDraft({
      id: p.eventId,
      title: p.rawTitle,
      description: p.description,
      start: arg.event.start!,
      end,
      allDay: arg.event.allDay,
      orderId: p.orderId,
      userId: p.userId,
    });
  };

  const onMove = async (arg: EventDropArg | EventResizeDoneArg) => {
    const p = arg.event.extendedProps as Record<string, string>;
    try {
      await moveCalendarItem({
        kind: p.kind as "event" | "scheduled" | "due",
        id: p.kind === "event" ? p.eventId : p.orderId,
        start: arg.event.start!.toISOString(),
        end: arg.event.end?.toISOString() ?? null,
        allDay: arg.event.allDay,
      });
      if (p.kind !== "event") refetch();
    } catch {
      arg.revert();
    }
  };

  /** Konwersja pól lokalnych na ISO (strefa przeglądarki) przed wysłaniem do serwera. */
  const submit = (fd: FormData) => {
    const s = String(fd.get("startLocal") ?? "");
    const e = String(fd.get("endLocal") ?? "");
    const parse = (v: string) => (allDay ? new Date(`${v}T00:00`) : new Date(v));
    if (s) fd.set("start", parse(s).toISOString());
    if (e) fd.set("end", (allDay ? addDays(parse(e), 1) : parse(e)).toISOString());
    fd.delete("startLocal");
    fd.delete("endLocal");
    formAction(fd);
  };

  const err = (k: string) => (state.errors?.[k] && !state.ok ? te(state.errors[k] as never) : undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Legend color="#1E63D6" label={t("legendScheduled")} />
        <Legend color="#D97706" label={t("legendDue")} />
        <Legend color="#667180" label={t("legendEvent")} />
        <Label className="ml-auto flex items-center gap-2 text-foreground">
          <Checkbox checked={mine} onChange={(e) => setMine(e.target.checked)} /> {t("onlyMine")}
        </Label>
      </div>
      <p className="text-sm text-muted-foreground">{t("hint")}</p>
      {loadError && <FormAlert code="generic" />}

      <div className="suppit-calendar rounded-xl border bg-card p-3 sm:p-4">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          locale={fcLocales[locale] ?? plLocale}
          firstDay={1}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
          height="auto"
          nowIndicator
          selectable
          editable
          dayMaxEvents={4}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          events={async (info, success, failure) => {
            try {
              const q = new URLSearchParams({ start: info.startStr, end: info.endStr, ...(mine ? { mine: "1" } : {}) });
              const res = await fetch(`/api/calendar?${q}`);
              if (!res.ok) throw new Error(String(res.status));
              setLoadError(false);
              success((await res.json()) as EventInput[]);
            } catch (e) {
              setLoadError(true);
              failure(e as Error);
            }
          }}
          select={onSelect}
          eventClick={onClick}
          eventDrop={onMove}
          eventResize={onMove}
        />
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogTitle>{draft?.id ? t("editEvent") : t("newEvent")}</DialogTitle>
          {draft && (
            <form action={submit} className="space-y-4" key={draft.id ?? draft.start.toISOString()}>
              {draft.id && <input type="hidden" name="id" value={draft.id} />}
              <FormField label={t("eventTitle")} htmlFor="ev-title" error={err("title")}>
                <Input id="ev-title" name="title" defaultValue={draft.title} required autoFocus />
              </FormField>
              <Label className="flex items-center gap-2">
                <Checkbox name="allDay" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> {t("allDay")}
              </Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t("start")} htmlFor="ev-start" error={err("start")}>
                  <Input id="ev-start" name="startLocal" type={allDay ? "date" : "datetime-local"} key={`s${allDay}`} defaultValue={toLocalInput(draft.start, allDay)} required />
                </FormField>
                <FormField label={t("end")} htmlFor="ev-end" error={err("end")}>
                  <Input id="ev-end" name="endLocal" type={allDay ? "date" : "datetime-local"} key={`e${allDay}`} defaultValue={toLocalInput(draft.end, allDay)} />
                </FormField>
              </div>
              <FormField label={t("order")} htmlFor="ev-order">
                <Select id="ev-order" name="orderId" defaultValue={draft.orderId}>
                  <option value="">{t("noOrder")}</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </Select>
              </FormField>
              <FormField label={t("assignee")} htmlFor="ev-user">
                <Select id="ev-user" name="userId" defaultValue={draft.userId}>
                  <option value="">—</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </FormField>
              <FormField label={t("description")} htmlFor="ev-desc">
                <Textarea id="ev-desc" name="description" defaultValue={draft.description} rows={3} />
              </FormField>
              {!state.ok && <FormAlert code={state.message} />}
              <div className="flex flex-wrap items-center gap-2">
                <SubmitButton>{tc("save")}</SubmitButton>
                {draft.orderId && (
                  <Button type="button" variant="outline" onClick={() => router.push(`/admin/orders/${draft.orderId}`)}>
                    <ExternalLink />{t("openOrder")}
                  </Button>
                )}
                {draft.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="ml-auto text-destructive"
                    onClick={async () => {
                      if (!confirm(tc("confirmDelete"))) return;
                      await deleteEvent(draft.id!);
                      setDraft(null);
                      refetch();
                    }}
                  >
                    <Trash2 />{tc("delete")}
                  </Button>
                )}
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="size-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
