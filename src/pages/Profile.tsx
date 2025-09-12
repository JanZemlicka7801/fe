import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { fmt, type LessonsResponse, type ClassDTO } from "./utils";

type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT" | string;

type UserDTO = {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  createdAt?: string;
  validated?: boolean;
  learner?: LearnerProfileDTO | null;
  instructor?: InstructorProfileDTO | null;
};

type LearnerProfileDTO = {
  userId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lessons?: number;
  id?: string;
};

type InstructorProfileDTO = {
  userId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  license?: string;
  experienceYears?: number;
  specialization?: string;
};

type DisplayNameDTO = { id: string; displayName: string };

function Banner({
                  text,
                  kind = "info",
                  onClose,
                }: {
  text: string;
  kind?: "info" | "warning" | "error" | "success";
  onClose?: () => void;
}) {
  if (!text) return null;
  const cls =
      kind === "warning"
          ? "banner warning"
          : kind === "error"
              ? "banner error"
              : kind === "success"
                  ? "banner success"
                  : "banner info";
  return (
      <div className={cls} role="status" aria-live="polite" style={{ marginBottom: 12 }}>
        <span>{text}</span>
        <button aria-label="Close" onClick={onClose} style={{ marginLeft: "auto" }}>
          ×
        </button>
      </div>
  );
}

const Profile: React.FC = () => {
  const { token, user: authUser } = useAuth() as any;

  const [me, setMe] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] =
      useState<"info" | "warning" | "error" | "success">("info");

  const [past, setPast] = useState<ClassDTO[]>([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastErr, setPastErr] = useState<string | null>(null);

  const [instNames, setInstNames] = useState<Record<string, string>>({});
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let abort = false;
    (async () => {
      if (!token) {
        setLoadErr("Not signed in.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setLoadErr(null);
        const data = (await apiFetch("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })) as UserDTO;
        if (!abort) setMe(data);
      } catch (e: any) {
        if (!abort) setLoadErr(e?.message || "Failed to load profile");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [token]);

  const isStudent = useMemo(
      () => /^(student|learner)$/i.test(String(me?.role ?? "")),
      [me?.role]
  );

  const learnerId = useMemo<string | null>(() => {
    const fromAuth = authUser?.learner?.id ?? null;
    const fromMe =
        (me as any)?.learner?.id ??
        (me as any)?.learner?.userId ??
        null;
    return fromAuth || fromMe || (isStudent ? me?.id ?? null : null);
  }, [authUser, me, isStudent]);

  useEffect(() => {
    if (!token || !learnerId) return;
    let abort = false;
    (async () => {
      try {
        setPastLoading(true);
        setPastErr(null);
        const res = (await apiFetch(`/classes/retrieve/${learnerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })) as LessonsResponse;

        const now = Date.now();
        const onlyPast = (res.classes || []).filter((c) => {
          const end = new Date((c as any).endsAt || c.startsAt).getTime();
          return end < now;
        });
        onlyPast.sort(
            (a, b) =>
                new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
        );

        if (!abort) setPast(onlyPast);
      } catch (e: any) {
        if (!abort) setPastErr(e?.message || "Failed to load past classes");
      } finally {
        if (!abort) setPastLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [token, learnerId]);

  useEffect(() => {
    if (!token || past.length === 0) return;

    const uniqueIds = Array.from(new Set(past.map((p) => p.instructorId))).filter(
        (x): x is string => !!x
    );

    const missing = uniqueIds.filter(
        (id) => !instNames[id] && !fetchedIdsRef.current.has(id)
    );
    if (missing.length === 0) return;

    let abort = false;
    (async () => {
      const entries: [string, string][] = [];
      for (const id of missing) {
        fetchedIdsRef.current.add(id);
        try {
          const dto = (await apiFetch(`/users/${id}/display-name`, {
            headers: { Authorization: `Bearer ${token}` },
          })) as DisplayNameDTO;
          entries.push([id, dto.displayName || id]);
        } catch {
          entries.push([id, id]);
        }
      }
      if (!abort && entries.length) {
        setInstNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    })();

    return () => {
      abort = true;
    };
  }, [token, past, instNames]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const initials = useMemo(() => {
    const first = me?.learner?.firstName || me?.instructor?.firstName || "";
    const last = me?.learner?.lastName || me?.instructor?.lastName || "";
    const base = (first && first[0]) + (last && last[0]) || (me?.email ? me.email[0] : "U");
    return base.toUpperCase();
  }, [me]);

  const fullName = useMemo(() => {
    const first = me?.learner?.firstName || me?.instructor?.firstName || "";
    const last = me?.learner?.lastName || me?.instructor?.lastName || "";
    return [first, last].filter(Boolean).join(" ") || me?.username || me?.email || "";
  }, [me]);

  async function changePassword(current: string, next: string) {
    if (!token) throw new Error("Not signed in.");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    setNoticeKind("success");
    setNotice("Password changed.");
  }

  if (loading) {
    return (
        <div className="page-container">
          <p>Loading…</p>
        </div>
    );
  }
  if (loadErr || !me) {
    return (
        <div className="page-container">
          <Banner text={loadErr || "No profile"} kind="error" onClose={() => setNotice(null)} />
        </div>
    );
  }

  const isAdmin = me.role === "ADMIN";
  const isInstructor = me.role === "INSTRUCTOR";

  return (
      <div className="page-container">

        <Banner text={notice ?? ""} kind={noticeKind} onClose={() => setNotice(null)} />

        <div className={`role-indicator ${isAdmin ? "admin" : "user"}`}>
          <span>{isAdmin ? "Administrator" : isInstructor ? "Instructor" : "Student"} Profile</span>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header" style={{ display: "flex", gap: 16 }}>
              <div className="profile-avatar">
                <div
                    className="avatar-placeholder"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: "#e9ecef",
                      fontWeight: 700,
                      fontSize: 22,
                    }}
                >
                  {initials}
                </div>
              </div>
              <div className="profile-info">
                <h2 style={{ margin: 0 }}>{fullName}</h2>
                <p style={{ margin: 0, opacity: 0.8 }}>
                  {isAdmin ? "Administrator" : isInstructor ? "Driving Instructor" : "Learner"}
                </p>
                <p style={{ margin: 0, opacity: 0.6 }}>ID: {me.id}</p>
              </div>
            </div>

            <div className="profile-details" style={{ marginTop: 16, display: "grid", gap: 16 }}>
              <div className="detail-group">
                <h3>Personal Information</h3>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>{" "}
                  <span className="detail-value">{me.email}</span>
                </div>
                {me.username && (
                    <div className="detail-item">
                      <span className="detail-label">Username:</span>{" "}
                      <span className="detail-value">{me.username}</span>
                    </div>
                )}
                {(me.learner?.phoneNumber || me.instructor?.phoneNumber) && (
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>{" "}
                      <span className="detail-value">
                    {me.learner?.phoneNumber || me.instructor?.phoneNumber}
                  </span>
                    </div>
                )}
                {me.createdAt && (
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>{" "}
                      <span className="detail-value">{me.createdAt}</span>
                    </div>
                )}
              </div>

              {isStudent && (
                  <div className="detail-group">
                    <h3>Learner Details</h3>
                    {(me.learner?.firstName || me.learner?.lastName) && (
                        <div className="detail-item">
                          <span className="detail-label">Name:</span>{" "}
                          <span className="detail-value">
                      {[me.learner?.firstName, me.learner?.lastName].filter(Boolean).join(" ")}
                    </span>
                        </div>
                    )}
                    {me.learner?.lessons != null && (
                        <div className="detail-item">
                          <span className="detail-label">Lessons booked:</span>{" "}
                          <span className="detail-value">{me.learner.lessons} / 28</span>
                        </div>
                    )}
                  </div>
              )}

              {isInstructor && (
                  <div className="detail-group">
                    <h3>Instructor Details</h3>
                    {(me.instructor?.firstName || me.instructor?.lastName) && (
                        <div className="detail-item">
                          <span className="detail-label">Name:</span>{" "}
                          <span className="detail-value">
                      {[me.instructor?.firstName, me.instructor?.lastName].filter(Boolean).join(" ")}
                    </span>
                        </div>
                    )}
                    {me.instructor?.license && (
                        <div className="detail-item">
                          <span className="detail-label">License:</span>{" "}
                          <span className="detail-value">{me.instructor.license}</span>
                        </div>
                    )}
                    {me.instructor?.experienceYears != null && (
                        <div className="detail-item">
                          <span className="detail-label">Experience:</span>{" "}
                          <span className="detail-value">{me.instructor.experienceYears} years</span>
                        </div>
                    )}
                    {me.instructor?.specialization && (
                        <div className="detail-item">
                          <span className="detail-label">Specialization:</span>{" "}
                          <span className="detail-value">{me.instructor.specialization}</span>
                        </div>
                    )}
                  </div>
              )}

              <div className="detail-group">
                <h3>Security</h3>
                <button className="btn-primary" onClick={() => setPwOpen(true)}>
                  Change Password
                </button>
              </div>

              {isStudent && (
                  <div className="detail-group">
                    <h3>Past classes</h3>
                    {!learnerId && <p>No learner profile found.</p>}
                    {learnerId && pastLoading && <p>Loading…</p>}
                    {learnerId && pastErr && (
                        <Banner text={pastErr} kind="error" onClose={() => setPastErr(null)} />
                    )}
                    {learnerId && !pastLoading && !pastErr && past.length === 0 && <p>No past classes.</p>}
                    {learnerId && !pastLoading && !pastErr && past.length > 0 && (
                        <div style={{ overflowX: "auto" }}>
                          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "6px 8px" }}>Start</th>
                              <th style={{ textAlign: "left", padding: "6px 8px" }}>End</th>
                              <th style={{ textAlign: "left", padding: "6px 8px" }}>Instructor</th>
                              <th style={{ textAlign: "left", padding: "6px 8px" }}>Type</th>
                            </tr>
                            </thead>
                            <tbody>
                            {past.map((c) => (
                                <tr key={c.id}>
                                  <td style={{ padding: "6px 8px" }}>{fmt(c.startsAt)}</td>
                                  <td style={{ padding: "6px 8px" }}>{fmt(c.endsAt)}</td>
                                  <td style={{ padding: "6px 8px" }}>
                                    {instNames[c.instructorId] ?? "Loading…"}
                                  </td>
                                  <td style={{ padding: "6px 8px" }}>{c.type ?? ""}</td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                    )}
                  </div>
              )}
            </div>
          </div>
        </div>

        <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} onSubmit={changePassword} />
      </div>
  );
};

export default Profile;