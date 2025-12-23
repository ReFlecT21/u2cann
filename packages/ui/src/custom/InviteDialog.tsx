import React, { useEffect, useState } from "react";

import { Textarea } from "@adh/ui/ui/text-area";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (emails: string, message: string) => void;
  name: string;
  projectName: string;
  projectDescription: string;
  hubType: string;
  deadline: string;
}

export function InviteDialog({
  open,
  onOpenChange,
  onConfirm,
  name,
  projectName,
  projectDescription,
  hubType,
  deadline,
}: InviteDialogProps) {
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(
      `Dear [Expert Name],\n\nMy name is ${name} from Asia Deal Hub, an expert network company that connects leading professionals with suitable projects.\n\nWe are pleased to invite you to participate in an exciting project.\n\nProject Name: ${projectName}\nDescription: ${projectDescription}\nHub Type: ${hubType}\nDeadline: ${new Date(deadline).toLocaleDateString()}\n\nWith your expertise and industry experience, we believe you would be a valuable candidate for this opportunity.\n\nTo express your interest and participate in this project, please complete the registration process and answer a brief questionnaire by clicking the button below.`,
    );
  }, [name, projectName, projectDescription, hubType, deadline]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Send Invitation to Unregistered Experts.
          </AlertDialogTitle>
        </AlertDialogHeader>

        <Input
          id="emails"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="Enter recipient email addresses, separated by commas"
        />
        <Label htmlFor="message">Invitation Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
        />
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={() => onConfirm(emails, message)}>OK</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
