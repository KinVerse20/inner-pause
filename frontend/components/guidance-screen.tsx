"use client";

import { useState } from "react";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { createMorningGuidanceMessage, upsertProfile } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function GuidanceScreen() {
  const state = useMvpState();
  const [phone, setPhone] = useState(state.profile.phone);
  const [time, setTime] = useState(state.profile.guidanceTime);
  const [status, setStatus] = useState("");

  const enable = () => {
    upsertProfile({ phone, guidanceTime: time, morningGuidanceEnabled: true });
    createMorningGuidanceMessage();
    setStatus("Morning guidance enabled. A sample message was created locally.");
  };

  const disable = () => {
    upsertProfile({ morningGuidanceEnabled: false });
    setStatus("Morning guidance disabled on this device.");
  };

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <SectionTitle title="WhatsApp Guidance" copy="Optional morning support using your saved patterns." />

        <details className="rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--background-card)] p-3.5">
          <summary className="cursor-pointer font-serif text-xl text-[#130b4f]">Consent summary</summary>
          <ul className="mt-3 space-y-1.5 text-sm leading-5 text-[#4b3f86]">
            <li>• You choose what time guidance is created.</li>
            <li>• Full reflection text is not sent in WhatsApp messages.</li>
            <li>• Consent can be withdrawn anytime.</li>
          </ul>
        </details>

        <GlassCard className="space-y-3 p-3.5">
          <label className="block">
            <span className="text-sm text-[#4b3f86]">Country code and phone number</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 555 0100" className="soft-input mt-2 w-full rounded-2xl p-3 outline-none" />
          </label>
          <label className="block">
            <span className="text-sm text-[#4b3f86]">Delivery time</span>
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="soft-input mt-2 w-full rounded-2xl p-3 outline-none" />
          </label>
          <GoldButton onClick={enable}>Enable Guidance</GoldButton>
          <button type="button" onClick={disable} className="min-h-11 rounded-full border border-purple-200 bg-white text-[#6d28d9]">Disable</button>
          {status ? <p className="text-sm text-[#6d28d9]">{status}</p> : null}
        </GlassCard>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[#130b4f]">Message history</h2>
          {state.morningGuidanceMessages.length ? (
            <div className="mt-3 space-y-2">
              {state.morningGuidanceMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-purple-100 bg-white/70 p-3">
                  <p className="line-clamp-2 text-sm leading-5 text-[#4b3f86]">{message.messageText}</p>
                  <p className="mt-2 text-xs text-[#6d5ea8]">{message.deliveryStatus} • {new Date(message.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#6d5ea8]">No guidance messages yet.</p>
          )}
        </GlassCard>
      </div>
    </MvpShell>
  );
}
