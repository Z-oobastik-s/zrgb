import { Generator } from '@/components/Generator'
import { SeoCrawlBlock } from '@/components/SeoCrawlBlock'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[min(92rem,calc(100vw-0.75rem))] flex-1 flex-col overflow-hidden px-2 py-1 sm:px-3 sm:py-2">
      <SeoCrawlBlock page="home" />
      <Generator />
    </main>
  )
}
