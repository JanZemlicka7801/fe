import React, { useState } from 'react';
import { StudentCreateDTO } from '../pages/utils';
import { addStudent, checkLearnerPhoneExists } from '../services/StudentService';
import { HttpError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (studentData: StudentCreateDTO) => void;
    submitError: string | null;
}

const capitalize = (s: string) =>
    s.trim().length
        ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase()
        : s.trim();

const to00420Format = (raw: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    let d = digits;
    if (d.startsWith('00420')) d = d.slice(2);
    if (d.startsWith('0420')) d = d.slice(1);
    if (d.startsWith('420')) {
        // ok
    } else if (d.length === 9) {
        d = '420' + d;
    }
    if (!/^420\d{9}$/.test(d)) {
        throw new Error("Phone must be like '00420 607 720 131'");
    }
    const n = d.slice(3);
    return `00420 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)}`;
};

const AddStudentModal: React.FC<AddStudentModalProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             onSubmit,
                                                         }) => {
    const { token } = useAuth();
    const [newStudent, setNewStudent] = useState<StudentCreateDTO>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);

    if (!isOpen) return null;

    const setField = (name: keyof StudentCreateDTO, value: string) => {
        setNewStudent((p) => ({ ...p, [name]: value }));
        setFormErrors((prev) => {
            const n = { ...prev };
            delete n[name as string];
            return n;
        });
        if (name === 'phone') setPhoneAvailable(null);
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target as { name: keyof StudentCreateDTO; value: string };
        setField(name, value);
    };

    const handleNameBlur = (name: 'firstName' | 'lastName') => {
        setField(name, capitalize(newStudent[name]));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!newStudent.firstName.trim()) errors.firstName = 'First Name is required.';
        if (!newStudent.lastName.trim()) errors.lastName = 'Last Name is required.';
        if (!newStudent.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
            errors.email = 'Invalid email format.';
        }
        try {
            if (newStudent.phone.trim()) {
                to00420Format(newStudent.phone);
            } else {
                errors.phone = 'Phone number is required.';
            }
        } catch (e: any) {
            errors.phone = e.message || "Phone must be like '00420 607 720 131'";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePhoneBlur = async () => {
        try {
            if (!newStudent.phone.trim() || !token) return;
            const formatted = to00420Format(newStudent.phone);
            setField('phone', formatted);
            setCheckingPhone(true);
            const exists = await checkLearnerPhoneExists(formatted, token);
            if (exists) {
                setPhoneAvailable(false);
                setFormErrors(p => ({ ...p, phone: 'Phone already in use.' }));
            } else {
                setPhoneAvailable(true);
            }
        } catch {
            setFormErrors(p => ({ ...p, phone: 'Couldn’t verify the phone. Please try again.' }));
        } finally {
            setCheckingPhone(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (!token) {
            setError('You are not logged in.');
            return;
        }

        let payload: StudentCreateDTO;
        try {
            payload = {
                ...newStudent,
                firstName: capitalize(newStudent.firstName),
                lastName: capitalize(newStudent.lastName),
                phone: to00420Format(newStudent.phone),
            };
        } catch (e: any) {
            setFormErrors((p) => ({ ...p, phone: e.message || 'Invalid phone number' }));
            return;
        }

        try {
            await addStudent(payload, token);
            setError(null);
            onSubmit(payload);
            setNewStudent({ firstName: '', lastName: '', email: '', phone: '' });
            onClose();
        } catch (e: any) {
            if (e instanceof HttpError && e.status === 409) {
                const msg = (e.message || '').toLowerCase();
                if (msg.includes('phone')) {
                    setFormErrors(p => ({ ...p, phone: 'Phone already in use.' }));
                    setError('Phone already in use.');
                } else {
                    setFormErrors(p => ({ ...p, email: 'Email already in use.' }));
                    setError('Email already in use.');
                }
                return;
            }
            setError(e.message || 'Failed to create student.');
        }
    };

    const modalStyles: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex',
        justifyContent: 'center', alignItems: 'center',
    };

    const modalBoxStyles: React.CSSProperties = {
        backgroundColor: '#fff', padding: '2rem', borderRadius: '8px',
        width: '100%', maxWidth: '520px', position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    };

    const closeButtonStyles: React.CSSProperties = {
        position: 'absolute', top: '10px', right: '15px',
        fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer',
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        width: '100%',
        padding: '0.5rem',
        border: formErrors[field] ? '1px solid red' : '1px solid #ccc',
        borderRadius: '4px',
    });

    return (
        <div style={modalStyles}>
            <div style={modalBoxStyles}>
                <button style={closeButtonStyles} onClick={onClose} aria-label="Close Modal">
                    &times;
                </button>
                <h2 style={{ marginBottom: '1rem' }}>Add New Student</h2>

                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem' }}>First Name:</label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            autoCapitalize="words"
                            value={newStudent.firstName}
                            onChange={handleInputChange}
                            onBlur={() => handleNameBlur('firstName')}
                            style={inputStyle('firstName')}
                            required
                        />
                        {formErrors.firstName && <div style={{ color: 'red', fontSize: '0.875rem' }}>{formErrors.firstName}</div>}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem' }}>Last Name:</label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            autoCapitalize="words"
                            value={newStudent.lastName}
                            onChange={handleInputChange}
                            onBlur={() => handleNameBlur('lastName')}
                            style={inputStyle('lastName')}
                            required
                        />
                        {formErrors.lastName && <div style={{ color: 'red', fontSize: '0.875rem' }}>{formErrors.lastName}</div>}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={newStudent.email}
                            onChange={handleInputChange}
                            style={inputStyle('email')}
                            required
                        />
                        {formErrors.email && <div style={{ color: 'red', fontSize: '0.875rem' }}>{formErrors.email}</div>}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Phone (format: 00420 607 720 131):
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            placeholder="00420 607 720 131"
                            value={newStudent.phone}
                            onChange={handleInputChange}
                            onBlur={handlePhoneBlur}
                            style={inputStyle('phone')}
                            required
                            pattern="^00420 \d{3} \d{3} \d{3}$"
                            title="Use format 00420 607 720 131"
                        />
                        {checkingPhone && <div style={{ fontSize: '0.875rem' }}>Checking phone…</div>}
                        {phoneAvailable === false && (
                            <div style={{ color: 'red', fontSize: '0.875rem' }}>Phone already in use.</div>
                        )}
                        {formErrors.phone && <div style={{ color: 'red', fontSize: '0.875rem' }}>{formErrors.phone}</div>}
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            opacity: checkingPhone ? 0.7 : 1,
                        }}
                        disabled={checkingPhone}
                    >
                        Create Student
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;