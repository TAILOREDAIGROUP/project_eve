"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ children, defaultValue, className, ...props }: any) => {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, setValue })
        }
        return child
      })}
    </div>
  )
}

const TabsList = ({ children, value, setValue, className, ...props }: any) => (
  <div
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          active: (child.props as any).value === value,
          onClick: () => setValue((child.props as any).value),
        })
      }
      return child
    })}
  </div>
)

const TabsTrigger = ({ children, active, onClick, className, ...props }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active && "bg-background text-foreground shadow",
      className
    )}
    {...props}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, activeValue, className, ...props }: any) => {
  if (value !== activeValue) return null
  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Helper to pass value down
const TabsWrapper = ({ children, defaultValue, className }: any) => {
  const [activeValue, setActiveValue] = React.useState(defaultValue)
  
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      if ((child.type as any).displayName === 'TabsList') {
        return React.cloneElement(child as React.ReactElement<any>, { value: activeValue, setValue: setActiveValue });
      }
      if ((child.type as any).displayName === 'TabsContent') {
        return React.cloneElement(child as React.ReactElement<any>, { activeValue });
      }
    }
    return child;
  });

  return <div className={cn("space-y-2", className)}>{childrenWithProps}</div>;
}

const TabsListComp = ({ children, value, setValue, className }: any) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, { 
          active: (child.props as any).value === value, 
          onClick: () => setValue((child.props as any).value) 
        });
      }
      return child;
    })}
  </div>
)
TabsListComp.displayName = 'TabsList';

const TabsTriggerComp = ({ children, value, active, onClick, className }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground",
      className
    )}
  >
    {children}
  </button>
)
TabsTriggerComp.displayName = 'TabsTrigger';

const TabsContentComp = ({ children, value, activeValue, className }: any) => {
  if (value !== activeValue) return null;
  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  );
}
TabsContentComp.displayName = 'TabsContent';

export { TabsWrapper as Tabs, TabsListComp as TabsList, TabsTriggerComp as TabsTrigger, TabsContentComp as TabsContent }
