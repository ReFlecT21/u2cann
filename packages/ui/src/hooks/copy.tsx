import { toast } from "sonner";

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.info("Copied to clipboard");
}
