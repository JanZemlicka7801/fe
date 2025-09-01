import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HttpError } from '../services/api';
import { updateStudent } from '../services/StudentService';
import { LearnerUpdateDTO } from '../pages/utils';

type EditStudentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    student: {
        id: string;
        name: string;
        email: string;
        phone: string;
    } | null;
    onSaved: (updated: { id: string; name: string; email: string; phone: string }) => void;
};

const capitalize = (s: string) =>
    s.trim().length ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : s.trim();

const splitName = (full: string) => {
    const t = (full || '').trim();
    if (!t) return { firstName: '', lastName: '' };
    const i = t.lastIndexOf(' ');
    return i === -1
        ? { firstName: t, lastName: '' }
        : { firstName: t.slice(0, i), lastName: t.slice(i + 1) };
};

const to00420Format = (raw: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    let d = digits;
    if (d.startsWith('00420')) {
    } else if (d.startsWith('420')) {
        d = '00420' + d.slice(3);
    } else if (d.length === 9) {
        d = '00420' + d;
    }
    if (!/^00420\d{9}$/.test(d)) throw new Error("Phone must be like '00420 607 720 131'");
    const n = d.slice(5);
    return `00420 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)}`;
};

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, student, onSaved }) => {
    const { token } = useAuth();
    const base = useMemo(() => splitName(student?.name || ''), [student?.name]);

    const [firstName, setFirstName] = useState(base.firstName);
    const [lastName, setLastName]   = useState(base.lastName);
    const [email, setEmail]         = useState(student?.email || '');
    const [phone, setPhone]         = useState(student?.phone || '');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        const b = splitName(student?.name || '');
        setFirstName(b.firstName);
        setLastName(b.lastName);
        setEmail(student?.email || '');
        setPhone(student?.phone || '');
        setErrors({});
        setError(null);
    }, [student]);

    if (!isOpen || !student) return null;

    const validate = () => {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = 'First name is required.';
        if (!lastName.trim()) e.lastName = 'Last name is required.';
        if (!email.trim()) e.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email.';
        try { to00420Format(phone); } catch (er: any) { e.phone = er.message; }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const onSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate() || !token) return;

        const dto: LearnerUpdateDTO = {
            firstName: capitalize(firstName),
            lastName: capitalize(lastName),
            email: email.trim(),
            phone: to00420Format(phone),
        };

        try {
            setSaving(true);
            const res = await updateStudent(student.id, dto, token);
            onSaved({
                id: student.id,
                name: `${res.firstName} ${res.lastName}`.trim(),
                email: res.email,
                phone: res.phone,
            });
            onClose();
        } catch (e: any) {
            if (e instanceof HttpError && e.status === 409) {
                const msg = (e.message || '').toLowerCase();
                if (msg.includes('phone')) setErrors((p) => ({ ...p, phone: 'Phone already in use.' }));
                else setErrors((p) => ({ ...p, email: 'Email already in use.' }));
                setError('Please fix the highlighted fields.');
            } else if (e instanceof HttpError && e.status === 400) {
                setErrors((p) => ({ ...p, phone: "Phone must be like '00420 607 720 131'" }));
                setError('Please fix the highlighted fields.');
            } else {
                setError('Failed to save changes.');
            }
        } finally {
            setSaving(false);
        }
    };

    const modalStyles: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    };
    const box: React.CSSProperties = {
        background: '#fff', padding: '2rem', borderRadius: 8, width: '100%', maxWidth: 520, position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,.3)',
    };
    const closeBtn: React.CSSProperties = { position: 'absolute', top: 10, right: 15, fontSize: '1.5rem', border: 'none', background: 'none', cursor: 'pointer' };
    const input = (k: string): React.CSSProperties => ({ width: '100%', padding: '.5rem', borderRadius: 4, border: errors[k] ? '1px solid red' : '1px solid #ccc' });

    return (
        <div style={modalStyles}>
            <div style={box}>
                <button style={closeBtn} onClick={onClose} aria-label="Close">×</button>
                <h2 style={{ marginBottom: '1rem' }}>Edit Learner</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={onSubmit} noValidate>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>First name</label>
                        <input value={firstName} onChange={(e)=>setFirstName(e.target.value)} onBlur={()=>setFirstName(capitalize(firstName))} style={input('firstName')} />
                        {errors.firstName && <div style={{ color:'red', fontSize:'.875rem' }}>{errors.firstName}</div>}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Last name</label>
                        <input value={lastName} onChange={(e)=>setLastName(e.target.value)} onBlur={()=>setLastName(capitalize(lastName))} style={input('lastName')} />
                        {errors.lastName && <div style={{ color:'red', fontSize:'.875rem' }}>{errors.lastName}</div>}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} style={input('email')} />
                        {errors.email && <div style={{ color:'red', fontSize:'.875rem' }}>{errors.email}</div>}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Phone (00420 607 720 131)</label>
                        <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="00420 607 720 131" style={input('phone')} />
                        {errors.phone && <div style={{ color:'red', fontSize:'.875rem' }}>{errors.phone}</div>}
                    </div>

                    <button type="submit" disabled={saving} style={{ width:'100%', padding:'.75rem', border:'none', borderRadius:4, background:'#4f46e5', color:'#fff', opacity: saving ? .7 : 1 }}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal;