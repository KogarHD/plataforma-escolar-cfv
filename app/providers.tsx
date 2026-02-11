
"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    supabase.auth.getSession();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {});

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
