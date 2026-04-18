"use client";

import { useActionState } from "react";
import { sendEmail, type SendEmailState } from "@/app/actions/send-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: SendEmailState = { status: "idle" };

export function ReachOutForm() {
  const [state, action, isPending] = useActionState(sendEmail, initialState);

  if (state.status === "sent") {
    return (
      <div className="flex h-full flex-col justify-center gap-[8px]">
        <p className="text-[20px] font-medium leading-[28px]">Message sent.</p>
        <p className="text-[13px] leading-[20px] text-foreground/60">
          Thanks for reaching out — I&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex h-full flex-col gap-[20px]">
      <div className="space-y-[4px]">
        <h1 className="text-[18px] font-inter-sans italic leading-[28px]">Lets Talk</h1>
        <p className="text-[13px] leading-[20px] text-foreground/60">
          Got a project, collaboration, or idea? Drop me a message.{" "}
          <a
            href="https://calendly.com/alksud/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Or book a 30-min meeting.
          </a>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-[16px]">
        <div className="grid gap-[16px] sm:grid-cols-2">
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Your name" required />
          </div>
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-[6px]">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" placeholder="What's this about?" />
        </div>

        <div className="flex flex-1 flex-col gap-[6px]">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell me more…"
            required
            className="flex-1"
            style={{ minHeight: 120 }}
          />
        </div>
      </div>

      {state.status === "error" && (
        <p className="text-[12px] text-secondary-1">{state.message}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className="bg-primary text-background hover:bg-primary-dark"
        >
          {isPending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
