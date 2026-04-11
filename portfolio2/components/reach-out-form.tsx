"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "sending" | "sent" | "error";

export function ReachOutForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex h-full flex-col justify-center gap-[8px]">
        <p className="text-[20px] font-medium leading-[28px]">Message sent.</p>
        <p className="text-[13px] leading-[20px] text-foreground/60">
          Thanks for reaching out — I&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-[4px] w-fit text-[12px] text-primary underline-offset-2 hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-[20px]">
      <div className="space-y-[4px]">
        <h1 className="text-[20px] font-medium leading-[28px]">Reach Out</h1>
        <p className="text-[13px] leading-[20px] text-foreground/60">
          Got a project, collaboration, or idea? Drop me a message.
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

      <div>
        <Button type="submit" disabled={status === "sending"} size="sm">
          {status === "sending" ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
