import * as React from "react"
import { cn } from "@/lib/utils"
import { Link } from "wouter";
import { Home } from "lucide-react";

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  separator?: React.ReactNode;
  homeHref?: string;
  showHomeIcon?: boolean;
}

export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {}

const Breadcrumb = React.forwardRef<
  HTMLDivElement,
  BreadcrumbProps
>(({ className, separator = "/", homeHref = "/", showHomeIcon = true, ...props }, ref) => (
  <nav className="flex" ref={ref} aria-label="breadcrumb" {...props}>
    <ol className={cn("flex items-center flex-wrap", className)}>
      {showHomeIcon && (
        <BreadcrumbItem href={homeHref}>
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </BreadcrumbItem>
      )}
      {props.children}
    </ol>
  </nav>
))
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  BreadcrumbItemProps
>(({ className, href, isCurrent = false, ...props }, ref) => {
  const BreadcrumbItem = (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-current={isCurrent ? "page" : undefined}
      {...props}
    >
      {props.children}
    </li>
  )

  return href && !isCurrent ? (
    <Link href={href} className="inline-flex items-center text-muted-foreground hover:text-foreground">
      {BreadcrumbItem}
    </Link>
  ) : (
    <span className={cn("inline-flex items-center", isCurrent ? "text-foreground font-medium" : "text-muted-foreground")}>
      {BreadcrumbItem}
    </span>
  )
})
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbSeparator = React.forwardRef<
  HTMLLIElement,
  BreadcrumbSeparatorProps
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("mx-2 text-muted-foreground text-xs", className)}
    aria-hidden="true"
    role="presentation"
    {...props}
  >
    /
  </li>
))
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator }