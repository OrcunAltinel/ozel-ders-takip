"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  aktiflikDegistir,
  profilDuzenle,
  sifreSifirla,
} from "@/actions/yonetim";
import {
  profilDuzenleSemasi,
  ROLLER,
  sifreSifirlaSemasi,
  type ProfilDuzenleGirdisi,
  type Rol,
  type SifreSifirlaGirdisi,
} from "@/lib/validasyon/yonetim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SifreAlani } from "./sifre-alani";

type Kullanici = {
  id: string;
  kullaniciAdi: string;
  adSoyad: string;
  rol: Rol;
  aktif: boolean;
};

const ROL_OGELERI = Object.entries(ROLLER).map(([value, label]) => ({
  value,
  label,
}));

type AcikDialog = "duzenle" | "sifre" | "aktiflik" | null;

/** Kullanıcı satırındaki "..." menüsü ve açtığı dialog'lar. */
export function KullaniciIslemleri({
  kullanici,
  kendisi,
}: {
  kullanici: Kullanici;
  /** Satır, oturumdaki yöneticinin kendisi mi? */
  kendisi: boolean;
}) {
  const [acikDialog, setAcikDialog] = useState<AcikDialog>(null);
  const kapat = () => setAcikDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontalIcon />
              <span className="sr-only">İşlemler</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setAcikDialog("duzenle")}>
            <PencilIcon />
            Bilgileri düzenle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAcikDialog("sifre")}>
            <KeyRoundIcon />
            Şifre belirle
          </DropdownMenuItem>
          {!kendisi ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant={kullanici.aktif ? "destructive" : "default"}
                onClick={() => setAcikDialog("aktiflik")}
              >
                {kullanici.aktif ? <UserXIcon /> : <UserCheckIcon />}
                {kullanici.aktif ? "Pasifleştir" : "Aktifleştir"}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {acikDialog === "duzenle" ? (
        <ProfilDuzenleDialog
          kullanici={kullanici}
          kendisi={kendisi}
          kapat={kapat}
        />
      ) : null}
      {acikDialog === "sifre" ? (
        <SifreDialog kullanici={kullanici} kapat={kapat} />
      ) : null}
      {acikDialog === "aktiflik" ? (
        <AktiflikDialog kullanici={kullanici} kapat={kapat} />
      ) : null}
    </>
  );
}

function ProfilDuzenleDialog({
  kullanici,
  kendisi,
  kapat,
}: {
  kullanici: Kullanici;
  kendisi: boolean;
  kapat: () => void;
}) {
  const [beklemede, baslatGecisi] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfilDuzenleGirdisi>({
    resolver: zodResolver(profilDuzenleSemasi),
    defaultValues: { adSoyad: kullanici.adSoyad, rol: kullanici.rol },
  });

  function gonder(girdi: ProfilDuzenleGirdisi) {
    baslatGecisi(async () => {
      const sonuc = await profilDuzenle(kullanici.id, girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Bilgiler güncellendi.");
      kapat();
    });
  }

  return (
    <Dialog open onOpenChange={(acik) => !acik && kapat()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bilgileri düzenle</DialogTitle>
          <DialogDescription>
            Kullanıcı adı (@{kullanici.kullaniciAdi}) değiştirilemez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.adSoyad}>
              <FieldLabel htmlFor="duzenle-ad">Ad soyad</FieldLabel>
              <Input id="duzenle-ad" autoFocus {...register("adSoyad")} />
              <FieldError errors={[errors.adSoyad]} />
            </Field>
            <Controller
              control={control}
              name="rol"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Rol</FieldLabel>
                  <Select
                    items={ROL_OGELERI}
                    value={field.value}
                    disabled={kendisi}
                    onValueChange={(deger) => field.onChange(deger ?? "hoca")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROL_OGELERI.map((oge) => (
                        <SelectItem key={oge.value} value={oge.value}>
                          {oge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={kapat}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={beklemede}>
              {beklemede ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SifreDialog({
  kullanici,
  kapat,
}: {
  kullanici: Kullanici;
  kapat: () => void;
}) {
  const [beklemede, baslatGecisi] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SifreSifirlaGirdisi>({
    resolver: zodResolver(sifreSifirlaSemasi),
    defaultValues: { sifre: "" },
  });

  function gonder(girdi: SifreSifirlaGirdisi) {
    baslatGecisi(async () => {
      const sonuc = await sifreSifirla(kullanici.id, girdi);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success("Yeni şifre kaydedildi.");
      kapat();
    });
  }

  return (
    <Dialog open onOpenChange={(acik) => !acik && kapat()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Şifre belirle</DialogTitle>
          <DialogDescription>
            {kullanici.adSoyad} (@{kullanici.kullaniciAdi}) için yeni şifre.
            Kaydetmeden önce şifreyi not alın; sonradan görüntülenemez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(gonder)} noValidate>
          <SifreAlani
            id="yeni-sifre-belirle"
            etiket="Yeni şifre"
            kayit={register("sifre")}
            hata={errors.sifre}
            uret={(sifre) => setValue("sifre", sifre, { shouldValidate: true })}
          />
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={kapat}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={beklemede}>
              {beklemede ? "Kaydediliyor…" : "Şifreyi kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AktiflikDialog({
  kullanici,
  kapat,
}: {
  kullanici: Kullanici;
  kapat: () => void;
}) {
  const [beklemede, baslatGecisi] = useTransition();
  const pasiflestir = kullanici.aktif;

  function onayla() {
    baslatGecisi(async () => {
      const sonuc = await aktiflikDegistir(kullanici.id, !pasiflestir);
      if ("hata" in sonuc) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(
        pasiflestir ? "Hesap pasifleştirildi." : "Hesap aktifleştirildi.",
      );
      kapat();
    });
  }

  return (
    <Dialog open onOpenChange={(acik) => !acik && kapat()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {kullanici.adSoyad}{" "}
            {pasiflestir ? "pasifleştirilsin" : "aktifleştirilsin"} mi?
          </DialogTitle>
          <DialogDescription>
            {pasiflestir
              ? "Hesap giriş yapamaz ve açık oturumu kapatılır. Verileri silinmez; istediğiniz zaman tekrar aktifleştirebilirsiniz."
              : "Hesap tekrar giriş yapabilir hale gelir."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={kapat}>
            Vazgeç
          </Button>
          <Button
            variant={pasiflestir ? "destructive" : "default"}
            onClick={onayla}
            disabled={beklemede}
          >
            {pasiflestir ? "Pasifleştir" : "Aktifleştir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
