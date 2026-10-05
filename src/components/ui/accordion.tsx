import * as React from "react"
import { cn } from "cn"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

type AccordionValue = string | string[] | undefined

const AccordionValueContext = React.createContext<AccordionValue>(undefined)
const AccordionItemOpenContext = React.createContext(false)

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  const currentValue = props.value !== undefined ? props.value : props.defaultValue
  return (
    <AccordionValueContext.Provider value={currentValue}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        className={cn("flex w-full flex-col", className)}
        {...props}
      />
    </AccordionValueContext.Provider>
  )
}

function AccordionItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  const rootValue = React.useContext(AccordionValueContext)
  const open = Array.isArray(rootValue)
    ? rootValue.includes(value)
    : rootValue === value
  return (
    <AccordionItemOpenContext.Provider value={open}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        value={value}
        className={cn("not-last:border-b", className)}
        {...props}
      >
        {children}
      </AccordionPrimitive.Item>
    </AccordionItemOpenContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-colors outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon data-slot="accordion-trigger-icon" className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden" />
        <ChevronUpIcon data-slot="accordion-trigger-icon" className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const open = React.useContext(AccordionItemOpenContext)
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      forceMount
      className="overflow-hidden text-sm"
      aria-hidden={!open}
      {...props}
    >
      <div
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] ease-in-out-strong",
          open
            ? "grid-rows-[1fr] opacity-100 duration-[240ms]"
            : "grid-rows-[0fr] opacity-0 duration-[420ms]"
        )}
      >
        <div
          className={cn(
            "min-h-0 overflow-hidden",
            !open && "pointer-events-none"
          )}
        >
          <div
            className={cn(
              "pt-0 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
              className
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </AccordionPrimitive.Content>
  )
}

function useAccordionItemOpen() {
  return React.useContext(AccordionItemOpenContext)
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, useAccordionItemOpen }
