import { TabGeneratorView } from '@/components/TabGeneratorView'
import { SeoCrawlBlock } from '@/components/SeoCrawlBlock'

export default function TabPage() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[min(92rem,calc(100vw-0.75rem))] flex-1 flex-col overflow-hidden px-2 pb-1 pt-0.5 sm:px-3 sm:pb-2 sm:pt-1">
      <SeoCrawlBlock page="tab" />
      <TabGeneratorView />
    </main>
  )
}
