import type { PageBlock } from '@/context/PageBuilderContext'

export default function HtmlCustomBlock({ block }: { block: PageBlock }) {
  const htmlContent = block.content.htmlContent || '<p>Add your custom HTML here...</p>'

  return (
    <section className="w-full">
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </section>
  )
}
