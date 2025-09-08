import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal"; // ← update path if needed

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
  const { token } = useAuth() as any;

  const [me, setMe] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] =
      useState<"info" | "warning" | "error" | "success">("info");

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
        const data = (await apiFetch("users/me", { token })) as UserDTO;
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
          <h1 className="page-title">Profile</h1>
          <p>Loading…</p>
        </div>
    );
  }
  if (loadErr || !me) {
    return (
        <div className="page-container">
          <h1 className="page-title">Profile</h1>
          <Banner text={loadErr || "No profile"} kind="error" onClose={() => setNotice(null)} />
        </div>
    );
  }

  const isAdmin = me.role === "ADMIN";
  const isInstructor = me.role === "INSTRUCTOR";
  const isStudent = me.role === "STUDENT";

  return (
      <div className="page-container">
        <h1 className="page-title">Profile</h1>

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
                      {[me.instructor?.firstName, me.instructor?.lastName]
                          .filter(Boolean)
                          .join(" ")}
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
            </div>
          </div>
        </div>

        <ChangePasswordModal
            open={pwOpen}
            onClose={() => setPwOpen(false)}
            onSubmit={changePassword}
        />
      </div>
  );
};

export default Profile;