import { Skeleton } from "@/components/ui/skeleton";

/**
 * Sayfa geçişlerinde sunucu yanıtı beklenirken anında gösterilir; menü ve
 * üst çubuk yerinde kalır. Production'da bağlantılar bu iskelete kadar
 * önceden yüklendiği için tıklama anında karşılık verir.
 */
export default function Yukleniyor() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-5/6" />
      </div>
    </div>
  );
}
