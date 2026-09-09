import { useCallback, useEffect, useState } from "react";
import type { PersonalProfile, UserProfile } from "../types";

const LIFESTYLE_KEY = "user_profile";
const PERSONAL_KEY = "personal_profile";

export const DEFAULT_PERSONAL: PersonalProfile = {
  name: "",
  wakeTime: "07:00",
  sleepTime: "23:00",
  focusAreas: [],
  goals: [],
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep the change for this session */
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personal, setPersonal] = useState<PersonalProfile>(DEFAULT_PERSONAL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIFESTYLE_KEY);
      setProfile(raw ? (JSON.parse(raw) as UserProfile) : null);
    } catch {
      setProfile(null);
    }
    setPersonal(read(PERSONAL_KEY, DEFAULT_PERSONAL));
    setReady(true);
  }, []);

  // Stored separately so the model payload can never pick up extra fields.
  const saveProfile = useCallback((next: UserProfile) => {
    write(LIFESTYLE_KEY, next);
    setProfile(next);
  }, []);

  const savePersonal = useCallback((patch: Partial<PersonalProfile>) => {
    setPersonal((current) => {
      const next = { ...current, ...patch };
      write(PERSONAL_KEY, next);
      return next;
    });
  }, []);

  return { profile, personal, saveProfile, savePersonal, ready, hasProfile: profile !== null };
}
