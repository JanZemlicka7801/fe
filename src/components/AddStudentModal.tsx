import React, { useState } from 'react';
import { StudentCreateDTO } from '../pages/utils';
import { addStudent } from '../services/StudentService';
import { HttpError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (studentData: StudentCreateDTO) => void; // keep as success callback
    submitError: string | null; // kept for compatibility but unused
}

const FIELDS = ['firstName', 'lastName', 'email', 'phone'] as const;

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

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        setError(null);
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        const phone = newStudent.phone.trim().replace(/\s+/g, '');
        if (!newStudent.firstName.trim()) errors.firstName = 'First Name is required.';
        if (!newStudent.lastName.trim()) errors.lastName = 'Last Name is required.';
        if (!newStudent.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
            errors.email = 'Invalid email format.';
        }
        if (!phone) {
            errors.phone = 'Phone number is required.';
        } else if (!/^(?:(\+|00)?420)?\d{9}$/.test(phone)) {
            errors.phone = 'Invalid Czech phone number.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        if (!token) {
            setError("You are not logged in.");
            return;
        }

        try {
            await addStudent(newStudent, token);
            setError(null);
            onSubmit(newStudent); // notify parent on success
            setNewStudent({ firstName: '', lastName: '', email: '', phone: '' });
            onClose();
        } catch (e: any) {
            if (e instanceof HttpError && e.status === 409) {
                setError('Email must be unique. This email is already in use.');
                return;
            }
            setError('Failed to create student.');
        }
    };

    const modalStyles: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex',
        justifyContent: 'center', alignItems: 'center',
    };

    const modalBoxStyles: React.CSSProperties = {
        backgroundColor: '#fff', padding: '2rem', borderRadius: '8px',
        width: '100%', maxWidth: '500px', position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    };

    const closeButtonStyles: React.CSSProperties = {
        position: 'absolute', top: '10px', right: '15px',
        fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer',
    };

    return (
        <div style={modalStyles}>
            <div style={modalBoxStyles}>
                <button style={closeButtonStyles} onClick={onClose} aria-label="Close Modal">
                    &times;
                </button>
                <h2 style={{ marginBottom: '1rem' }}>Add New Student</h2>

                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {FIELDS.map((field) => (
                        <div key={field} style={{ marginBottom: '1rem' }}>
                            <label htmlFor={field} style={{ display: 'block', marginBottom: '0.5rem' }}>
                                {field.charAt(0).toUpperCase() + field.slice(1)}:
                            </label>
                            <input
                                type="text"
                                id={field}
                                name={field}
                                value={(newStudent as any)[field] ?? ''}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: formErrors[field] ? '1px solid red' : '1px solid #ccc',
                                    borderRadius: '4px',
                                }}
                            />
                            {formErrors[field] && (
                                <div style={{ color: 'red', fontSize: '0.875rem' }}>{formErrors[field]}</div>
                            )}
                        </div>
                    ))}

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
                        }}
                    >
                        Create Student
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;