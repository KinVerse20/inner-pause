"use client";

import { useState } from "react";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { createMorningGuidanceMessage, upsertProfile } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function GuidanceScreen() {
  const state = useMvpState();
  const [phone, setPhone] = useState(state.profile.phone);
  const [time, setTime] = useState(state.profile.guidanceTime);

  const enable = () => {
    upsertProfile({ phone, guidanceTime: time, morningGuidanceEnabled: true });
    createMorningGuidanceMessage();
  };

  return (
    <MvpShell>
      <div className="space-y-5">
        <SectionTitle title="Morning Guidance" copy="Optional WhatsApp guidance. In development, messages are generated with a mock provider and are not falsely marked as delivered." />

        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">Consent</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-300">
            <li>• You choose what time guidance is created.</li>
            <li>• Full journal text is not sent in WhatsApp messages.</li>
            <li>• Consent can be withdrawn anytime.</li>
            <li>• Provider interface supports Meta WhatsApp Cloud API or Twilio later.</li>
          </ul>
        </GlassCard>

        <GlassCard className="space-y-4 p-5">
          <label className="block">
            <span className="text-sm text-stone-400">Country code and phone number</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 555 0100" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100 outline-none" />
          </label>
          <label className="block">
            <span className="text-sm text-stone-400">Delivery time</span>
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100 outline-none" />
          </label>
          <GoldButton onClick={enable}>Enable Mock Guidance</GoldButton>
          <button type="button" onClick={() => upsertProfile({ morningGuidanceEnabled: false })} className="min-h-11 rounded-full border border-white/10 text-stone-300">Disable</button>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">Message history</h2>
          {state.morningGuidanceMessages.length ? (
            <div className="mt-4 space-y-3">
              {state.morningGuidanceMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm leading-6 text-stone-200">{message.messageText}</p>
                  <p className="mt-2 text-xs text-stone-500">{message.deliveryStatus} • {new Date(message.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-400">No mock guidance messages yet.</p>
          )}
        </GlassCard>
      </div>
    </MvpShell>
  );
}
