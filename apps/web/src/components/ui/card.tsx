import * as React from "react";

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  const classes = [
    "rounded-xl border bg-white shadow-sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}

