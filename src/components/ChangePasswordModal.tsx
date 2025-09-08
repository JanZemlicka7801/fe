import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (current: string, next: string) => Promise<void>;
};

export default function ChangePasswordModal({ open, onClose, onSubmit }: Props) {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const firstRef = useRef<HTMLInputElement>(null);
    const lastActive = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (open) {
            lastActive.current = document.activeElement as HTMLElement | null;
            const t = setTimeout(() => firstRef.current?.focus(), 0);
            return () => clearTimeout(t);
        } else {
            lastActive.current?.focus?.();
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const canSubmit = current && next && confirm && next === confirm && !busy;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true);
        setErr(null);
        try {
            await onSubmit(current, next);
            setCurrent("");
            setNext("");
            setConfirm("");
            onClose();
        } catch (ex: any) {
            setErr(ex?.message || "Change failed");
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;

    return createPortal(
        <>
            <style>{modalCss}</style>

            <div className="dlg-backdrop" onClick={onClose} />

            <div
                className="dlg-wrap"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pw-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="dlg-card">
                    <button className="dlg-close" aria-label="Close" onClick={onClose}>
                        ×
                    </button>

                    <h2 id="pw-title" className="dlg-title">Change Password</h2>

                    <form onSubmit={handleSubmit} className="dlg-body">
                        <div className="field">
                            <label>Current password</label>
                            <input
                                ref={firstRef}
                                type="password"
                                value={current}
                                onChange={(e) => setCurrent(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>New password</label>
                            <input
                                type="password"
                                value={next}
                                onChange={(e) => setNext(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="field">
                            <label>Confirm new password</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                        </div>

                        {err && <div className="dlg-error">{err}</div>}

                        <div className="dlg-actions">
                            <button type="button" className="btn ghost" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn primary" disabled={!canSubmit}>
                                {busy ? "Changing…" : "Change Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
}

const modalCss = `

.dlg-backdrop{
  position:fixed; inset:0;
  background:rgba(2,6,23,.55);
  backdrop-filter:saturate(120%) blur(2px);
  animation:fadeIn .12s ease-out;
}
.dlg-wrap{
  position:fixed; inset:0;
  display:grid; place-items:center;
  padding:24px;
  z-index:50;
}
.dlg-card{
  width:min(760px, 92vw);
  background:#fff;
  border-radius:16px;
  box-shadow:0 20px 60px rgba(2,6,23,.25);
  position:relative;
  padding:24px 24px 20px;
  transform:scale(.98);
  opacity:0;
  animation:popIn .14s ease-out forwards;
}
.dlg-close{
  position:absolute; top:10px; right:12px;
  width:28px; height:28px; line-height:24px;
  font-size:22px; border:0; background:transparent; cursor:pointer;
  color:#64748b;
}
.dlg-title{
  margin:0 0 8px 0;
  font-size:22px; letter-spacing:.2px;
}
.dlg-body{ display:grid; gap:14px; }
.field{ display:grid; gap:6px; }
.field label{ font-size:14px; color:#475569; }
.field input{
  border:1px solid #e2e8f0; border-radius:10px; height:40px; padding:0 12px;
  outline:none;
}
.field input:focus{ border-color:#94a3b8; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.dlg-error{
  color:#b91c1c; background:#fee2e2; border:1px solid #fecaca;
  padding:10px 12px; border-radius:10px; font-size:14px;
}
.dlg-actions{
  display:flex; justify-content:flex-end; gap:10px; margin-top:6px;
}
.btn{
  height:40px; padding:0 14px; border-radius:10px; border:1px solid transparent; cursor:pointer;
}
.btn.ghost{ background:#f1f5f9; color:#0f172a; }
.btn.primary{ background: #1459e8; color:#fff; }
.btn[disabled]{ opacity:.6; cursor:not-allowed; }

@keyframes fadeIn{ from{opacity:0} to{opacity:1} }
@keyframes popIn{ to{ transform:scale(1); opacity:1 } }
`;