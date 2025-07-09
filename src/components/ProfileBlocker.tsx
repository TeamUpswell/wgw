import React, { useEffect, useState } from "react";
import { RequireProfileModal } from "../components/RequireProfileModal";
import { supabase } from "../config/supabase";

export function ProfileBlocker({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) {
  const [needsProfile, setNeedsProfile] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user?.id) {
        setNeedsProfile(false);
        setChecking(false);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("username, display_name")
        .eq("id", user.id)
        .single();
      if (error || !data) {
        setNeedsProfile(true);
      } else {
        setNeedsProfile(!data.username || !data.display_name);
      }
      setChecking(false);
    };
    checkProfile();
  }, [user?.id]);

  if (checking) return null;

  return (
    <>
      <RequireProfileModal
        visible={needsProfile}
        userId={user.id}
        onComplete={() => setNeedsProfile(false)}
      />
      {!needsProfile && children}
    </>
  );
}
