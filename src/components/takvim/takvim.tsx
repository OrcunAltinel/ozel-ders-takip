"use client";

import { useCallback, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from "@fullcalendar/core/locales/tr";
import type {
  DateSelectArg,
  EventChangeArg,
  EventClickArg,
  EventContentArg,
  EventInput,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import { differenceInMinutes, format, subDays } from "date-fns";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  dersGuncelle,
  takvimDersleriniGetir,
  type TakvimDersi,
} from "@/actions/dersler";
import { saateDakikaEkle } from "@/lib/zaman/saat";
import { Button } from "@/components/ui/button";
import {
  DersFormuDialog,
  type GrupSecenegi,
  type YeniDersBaslangici,
} from "./ders-formu-dialog";
import { DersDetayDialog } from "./ders-detay-dialog";

const SAAT_BICIMI = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

function dersiEtkinligeCevir(ders: TakvimDersi): EventInput {
  return {
    id: ders.id,
    title: ders.konu ? `${ders.grupAdi} · ${ders.konu}` : ders.grupAdi,
    start: `${ders.tarih}T${ders.baslangicSaati}:00`,
    end: `${ders.tarih}T${ders.bitisSaati}:00`,
    backgroundColor: ders.renk,
    borderColor: ders.renk,
    classNames: [`ders-${ders.durum}`],
    extendedProps: { ders },
  };
}

/**
 * Ders kutusunun içeriği: her görünümde (kısa dersler ve dar telefon
 * ekranı dahil) "16:00–17:30" biçiminde başlangıç VE bitiş saati gösterilir.
 * Liste görünümü saat aralığını zaten kendi sütununda gösterdiği için
 * varsayılan içerik kullanılır.
 */
function etkinlikIcerigi(arg: EventContentArg) {
  if (arg.view.type.startsWith("list")) return true;
  const ders = arg.event.extendedProps.ders as TakvimDersi;
  return (
    <div className="overflow-hidden px-0.5 text-[0.75rem] leading-tight">
      <div className="font-semibold whitespace-nowrap">
        {ders.baslangicSaati}–{ders.bitisSaati}
      </div>
      <div className="truncate">{arg.event.title}</div>
    </div>
  );
}

type FormDurumu =
  | { mod: "yeni"; baslangic: YeniDersBaslangici; anahtar: number }
  | { mod: "duzenle"; ders: TakvimDersi; anahtar: number }
  | null;

export function Takvim({
  gruplar,
  mobil,
}: {
  gruplar: GrupSecenegi[];
  mobil: boolean;
}) {
  const takvimRef = useRef<FullCalendar>(null);
  const [form, setForm] = useState<FormDurumu>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [seciliDers, setSeciliDers] = useState<TakvimDersi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const yenile = useCallback(() => {
    takvimRef.current?.getApi().refetchEvents();
  }, []);

  const etkinlikleriGetir = useCallback(
    async (bilgi: EventSourceFuncArg): Promise<EventInput[]> => {
      // FullCalendar bitişi hariç tutar; sunucu iki ucu da dahil bekler.
      const sonuc = await takvimDersleriniGetir(
        format(bilgi.start, "yyyy-MM-dd"),
        format(subDays(bilgi.end, 1), "yyyy-MM-dd"),
      );
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return [];
      }
      return sonuc.dersler.map(dersiEtkinligeCevir);
    },
    [],
  );

  function yeniDersFormuAc(baslangic: YeniDersBaslangici) {
    setForm({ mod: "yeni", baslangic, anahtar: Date.now() });
    setFormAcik(true);
  }

  function aralikSecildi(secim: DateSelectArg) {
    secim.view.calendar.unselect();
    const tarih = format(secim.start, "yyyy-MM-dd");

    if (secim.allDay) {
      yeniDersFormuAc({ tarih, baslangicSaati: "16:00", bitisSaati: "17:00" });
      return;
    }

    const baslangicSaati = format(secim.start, "HH:mm");
    // Tek bir yarım saatlik kutuya tıklanınca varsayılan ders süresi 1 saat.
    const tekKutu = differenceInMinutes(secim.end, secim.start) <= 30;
    const ayniGun = format(secim.end, "yyyy-MM-dd") === tarih;
    const bitisSaati =
      tekKutu || !ayniGun
        ? saateDakikaEkle(baslangicSaati, 60)
        : format(secim.end, "HH:mm");

    yeniDersFormuAc({ tarih, baslangicSaati, bitisSaati });
  }

  function etkinlikTiklandi(tiklama: EventClickArg) {
    setSeciliDers(tiklama.event.extendedProps.ders as TakvimDersi);
  }

  /** Sürükle-bırak veya boyutlandırma ile dersin zamanı değişti. */
  async function etkinlikDegisti(degisim: EventChangeArg) {
    const { event } = degisim;
    const ders = event.extendedProps.ders as TakvimDersi;
    if (!event.start || !event.end) {
      degisim.revert();
      return;
    }

    const tarih = format(event.start, "yyyy-MM-dd");
    if (format(event.end, "yyyy-MM-dd") !== tarih) {
      toast.error("Ders gece yarısını geçemez.");
      degisim.revert();
      return;
    }

    const sonuc = await dersGuncelle(ders.id, {
      tarih,
      baslangicSaati: format(event.start, "HH:mm"),
      bitisSaati: format(event.end, "HH:mm"),
      konu: ders.konu ?? "",
    });

    if ("hata" in sonuc) {
      toast.error(sonuc.hata);
      degisim.revert();
      return;
    }
    toast.success("Ders zamanı güncellendi.");
    yenile();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end gap-3">
        {yukleniyor ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Yükleniyor
          </span>
        ) : null}
        <Button
          onClick={() =>
            yeniDersFormuAc({
              tarih: format(new Date(), "yyyy-MM-dd"),
              baslangicSaati: "16:00",
              bitisSaati: "17:00",
            })
          }
        >
          <PlusIcon />
          Yeni ders
        </Button>
      </div>

      <div className="takvim rounded-xl border bg-card p-2 sm:p-3">
        <FullCalendar
          ref={takvimRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          locale={trLocale}
          firstDay={1}
          initialView={mobil ? "listWeek" : "timeGridWeek"}
          headerToolbar={
            mobil
              ? { left: "prev,next", center: "title", right: "today" }
              : {
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                }
          }
          footerToolbar={
            mobil ? { center: "timeGridDay,listWeek,dayGridMonth" } : undefined
          }
          buttonText={{ listWeek: "Liste" }}
          height="auto"
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          scrollTime="14:00:00"
          slotLabelFormat={SAAT_BICIMI}
          eventTimeFormat={SAAT_BICIMI}
          displayEventEnd
          eventDisplay="block"
          eventContent={etkinlikIcerigi}
          nowIndicator
          dayMaxEvents={3}
          selectable
          selectMirror
          longPressDelay={400}
          editable
          eventDurationEditable
          events={etkinlikleriGetir}
          loading={setYukleniyor}
          select={aralikSecildi}
          eventClick={etkinlikTiklandi}
          eventChange={etkinlikDegisti}
        />
      </div>

      {form ? (
        form.mod === "yeni" ? (
          <DersFormuDialog
            key={form.anahtar}
            mod="yeni"
            baslangic={form.baslangic}
            acik={formAcik}
            acikligiDegistir={setFormAcik}
            gruplar={gruplar}
            kaydedilince={yenile}
          />
        ) : (
          <DersFormuDialog
            key={form.anahtar}
            mod="duzenle"
            ders={form.ders}
            acik={formAcik}
            acikligiDegistir={setFormAcik}
            gruplar={gruplar}
            kaydedilince={yenile}
          />
        )
      ) : null}

      <DersDetayDialog
        ders={seciliDers}
        acikligiDegistir={(acik) => {
          if (!acik) setSeciliDers(null);
        }}
        duzenle={(ders) => {
          setSeciliDers(null);
          setForm({ mod: "duzenle", ders, anahtar: Date.now() });
          setFormAcik(true);
        }}
        degisince={yenile}
      />
    </div>
  );
}
