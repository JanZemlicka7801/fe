import React, { useState } from 'react';
import { StudentCreateDTO } from '../services/StudentService';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (studentData: StudentCreateDTO) => void;
    submitError: string | null;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             onSubmit,
                                                             submitError,
                                                         }) => {
    const [newStudent, setNewStudent] = useState<StudentCreateDTO>({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        lessons: 0,
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewStudent((prev) => ({
            ...prev,
            [name]: name === 'lessons' ? parseInt(value) : value,
        }));
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        const phone = newStudent.phoneNumber.trim().replace(/\s+/g, '');
        if (!newStudent.firstName.trim()) errors.firstName = 'First Name is required.';
        if (!newStudent.lastName.trim()) errors.lastName = 'Last Name is required.';
        if (!newStudent.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
            errors.email = 'Invalid email format.';
        }
        if (!phone) {
            errors.phoneNumber = 'Phone number is required.';
        } else if (!/^(?:(\+|00)?420)?\d{9}$/.test(phone)) {
            errors.phoneNumber = 'Invalid Czech phone number.';
        }
        if (isNaN(newStudent.lessons) || newStudent.lessons < 0) {
            errors.lessons = 'Lessons must be a non-negative number.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(newStudent);
            setNewStudent({
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
                lessons: 0,
            });
            setFormErrors({});
        }
    };

    const modalStyles: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const modalBoxStyles: React.CSSProperties = {
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '500px',
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    };

    const closeButtonStyles: React.CSSProperties = {
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '1.5rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
    };

    return (
        <div style={modalStyles}>
            <div style={modalBoxStyles}>
                <button style={closeButtonStyles} onClick={onClose} aria-label="Close Modal">
                    &times;
                </button>
                <h2 style={{ marginBottom: '1rem' }}>Add New Student</h2>

                {submitError && (
                    <div style={{ color: 'red', marginBottom: '1rem' }}>{submitError}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {['firstName', 'lastName', 'email', 'phoneNumber', 'lessons'].map((field) => (
                        <div key={field} style={{ marginBottom: '1rem' }}>
                            <label htmlFor={field} style={{ display: 'block', marginBottom: '0.5rem' }}>
                                {field.charAt(0).toUpperCase() + field.slice(1)}:
                            </label>
                            <input
                                type={field === 'lessons' ? 'number' : 'text'}
                                id={field}
                                name={field}
                                value={(newStudent as any)[field]}
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