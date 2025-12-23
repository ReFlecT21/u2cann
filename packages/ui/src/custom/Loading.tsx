"use client";

import { cn } from "..";

interface LoadingProps {
  className?: string;
}

export function Loading(props: LoadingProps) {
  return <div className={cn("", props.className)}>Loading...</div>;
}
