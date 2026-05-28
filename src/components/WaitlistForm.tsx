import React, { useState } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim(), source: 'homepage' });

    setStatus(error ? 'error' : 'success');
  }

  if (status === 'success') {
    return (
      <div className="nb-card p-6 text-center">
        <p className="text-base font-black uppercase tracking-wider text-indigo-600">
          You're in! We'll let you know when your spot is ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="nb-card p-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-5 py-3 border-3 border-black shadow-neubrutal-sm bg-white text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-black"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-500 text-white border-3 border-black shadow-neubrutal-sm font-black uppercase tracking-widest hover:-translate-y-0.5 hover:shadow-none transition-all active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ChevronRight className="w-5 h-5" />
              Join the waitlist
            </>
          )}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-3 text-sm font-bold text-rose-600">
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}
