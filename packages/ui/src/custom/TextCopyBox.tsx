"use client";

import { ClipboardCopy } from "lucide-react";

import { copyToClipboard } from "../hooks/copy";
import { Button } from "../ui/button";

interface TextCopyBoxProps {
  text: string;
  title: string;
}

export function TextCopyBox({ text, title }: TextCopyBoxProps) {
  return (
    <div className="w-fit max-w-full overflow-hidden rounded-md border">
      <div className="flex items-center justify-between gap-4 border-b p-2">
        <p className="font-semibold">{title}</p>
        <Button
          variant={"outline"}
          onClick={() => copyToClipboard(text)}
          size={"icon"}
          className="size-6"
        >
          <ClipboardCopy size={16} />
        </Button>
      </div>
      <div className="w-full overflow-x-scroll bg-muted p-2">
        <code>{text}</code>
      </div>
    </div>
  );
}
