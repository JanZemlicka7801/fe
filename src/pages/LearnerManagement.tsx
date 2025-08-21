import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Learner = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    lessons: number;
};

const defaultForm: Omit<Learner, 'id'> = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    lessons: 0,
};

const LearnerManagement: React.FC = () => {
    const [learners, setLearners] = useState<Learner[]>([]);
    const [form, setForm] = useState(defaultForm);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchLearners = async () => {
        const res = await axios.get<Learner[]>('/api/learners');
        setLearners(res.data);
    };

    useEffect(() => {
        fetchLearners();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: name === 'lessons' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await axios.put(`/api/learners/${editingId}`, form);
        } else {
            await axios.post('/api/learners', form);
        }
        setForm(defaultForm);
        setEditingId(null);
        fetchLearners();
    };

    const handleEdit = (learner: Learner) => {
        setForm({ ...learner });
        setEditingId(learner.id);
    };

    const handleDelete = async (id: string) => {
        await axios.delete(`/api/learners/${id}`);
        fetchLearners();
    };

    const handleCancel = () => {
        setForm(defaultForm);
        setEditingId(null);
    };

    return (
        <div className="learner-management">
            <form onSubmit={handleSubmit} className="learner-form">
                <input name="firstName" value={form.firstName} onChange={handleInputChange} placeholder="First Name" required />
                <input name="lastName" value={form.lastName} onChange={handleInputChange} placeholder="Last Name" required />
                <input name="email" type="email" value={form.email} onChange={handleInputChange} placeholder="Email" required />
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleInputChange} placeholder="Phone Number" required />
                <input name="lessons" type="number" value={form.lessons} onChange={handleInputChange} placeholder="Lessons" required />

                <button type="submit" className="btn-primary">{editingId ? 'Update Learner' : 'Add Learner'}</button>
                {editingId && <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>}
            </form>

            <table className="learner-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Lessons</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {learners.map((learner) => (
                    <tr key={learner.id}>
                        <td>{learner.firstName} {learner.lastName}</td>
                        <td>{learner.email}</td>
                        <td>{learner.phoneNumber}</td>
                        <td>{learner.lessons}</td>
                        <td>
                            <button onClick={() => handleEdit(learner)} className="btn-small">Edit</button>
                            <button onClick={() => handleDelete(learner.id)} className="btn-small btn-danger">Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default LearnerManagement;