import * as React from "react"
import { cn } from "cn"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

const edgeFadeMask =
  "[mask-image:linear-gradient(to_bottom,black_0,black_calc(100%_-_32px),transparent_100%)]"

function ScrollArea({
  className,
  children,
  edgeFade = false,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  edgeFade?: boolean
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [faded, setFaded] = React.useState(false)

  React.useEffect(() => {
    if (!edgeFade) return
    const viewport = viewportRef.current
    if (!viewport) return
    const update = () => {
      const more =
        viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1
      setFaded((prev) => (prev === more ? prev : more))
    }
    update()
    viewport.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    Array.from(viewport.children).forEach((child) => observer.observe(child))
    return () => {
      viewport.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [edgeFade])

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className={cn(
          "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
          edgeFade && faded && edgeFadeMask
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
