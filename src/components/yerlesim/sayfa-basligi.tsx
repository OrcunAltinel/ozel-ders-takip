export function SayfaBasligi({
  baslik,
  aciklama,
  children,
}: {
  baslik: string;
  aciklama?: string;
  /** Sağ tarafta gösterilecek eylem butonları. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{baslik}</h1>
        {aciklama ? (
          <p className="mt-1 text-sm text-muted-foreground">{aciklama}</p>
        ) : null}
      </div>
      {children ? <div className="flex gap-2">{children}</div> : null}
    </div>
  );
}
