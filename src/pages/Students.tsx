import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchStudents,
  addStudent,
  deleteStudent,
  fetchUsersByRoles,
  type AppUser,
} from '../services/StudentService';
import AddStudentModal from '../components/AddStudentModal';
import ConfirmModal from '../components/ConfirmModal';
import EditStudentModal from '../components/EditStudentModal';
import {fmt, LessonsResponse, Student, StudentCreateDTO} from "./utils";

const toTime = (s?: string | null) => {
  if (!s) return Number.POSITIVE_INFINITY;
  const t = Date.parse(s);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

const Students: React.FC = () => {
  const auth = useAuth() as any;
  const { token } = auth;
  const isAdmin: boolean = !!auth.isAdmin;
  const isInstructor: boolean = !!auth.isInstructor;
  const canManage = isAdmin || isInstructor;

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Student['status']>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonsResponse | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Authentication token not available.');
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchStudents(token);
        if (!cancelled) setStudents(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUsers([]);
      return;
    }
    fetchUsersByRoles(token).then(setUsers).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!selectedStudent || !token) {
      setLessons(null);
      setLessonsError(null);
      setLessonsLoading(false);
      return;
    }
    let aborted = false;
    setLessonsLoading(true);
    setLessonsError(null);

    (async () => {
      try {
        const res = await fetch(`/api/classes/retrieve/${selectedStudent.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 204) { if (!aborted) setLessons({ total: 0, classes: [] }); return; }

        const text = await res.text();
        const data: LessonsResponse = text ? JSON.parse(text) : { total: 0, classes: [] };
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        if (!aborted) setLessons(data);
      } catch (e: any) {
        if (!aborted) { setLessonsError(e.message || 'Failed to load classes'); setLessons({ total: 0, classes: [] }); }
      } finally {
        if (!aborted) setLessonsLoading(false);
      }
    })();

    return () => { aborted = true; };
  }, [selectedStudent, token]);

  const visibleStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = students.filter((s) => {
      const matchesName = (s?.name || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesName && matchesStatus;
    });
    return filtered.slice().sort((a, b) => toTime(a.nextLesson) - toTime(b.nextLesson));
  }, [students, searchTerm, statusFilter]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
        (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddStudentSubmit = async (studentData: StudentCreateDTO) => {
    if (!token) {
      setAddStudentError('Authentication token not available.');
      return;
    }
    setAddStudentError(null);
    try {
      const added = await addStudent(studentData, token);
      const status: Student['status'] =
          (added as any).status ?? ((added as any).validated ? 'active' : 'inactive');
      setStudents((prev) => [...prev, { ...added, status }]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddStudentError(err.message);
    }
  };

  const handleStudentClick = (student: Student) => setSelectedStudent(student);
  const closeStudentDetails = () => setSelectedStudent(null);

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.id, token);
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      if (selectedStudent?.id === studentToDelete.id) setSelectedStudent(null);
    } catch (error: any) {
      alert(`Error deleting student: ${error.message}`);
    } finally {
      setStudentToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const cancelDelete = () => {
    setIsConfirmOpen(false);
    setStudentToDelete(null);
  };

  const openEdit = (s: Student) => {
    setStudentToEdit(s);
    setIsEditOpen(true);
  };
  const closeEdit = () => {
    setIsEditOpen(false);
    setStudentToEdit(null);
  };
  const onEdited = (u: { id: string; name: string; email: string; phone: string }) => {
    setStudents((prev) =>
        prev.map((s) => (s.id === u.id ? { ...s, name: u.name, email: u.email, phone: u.phone } : s))
    );
    if (selectedStudent?.id === u.id)
      setSelectedStudent((p) => (p ? { ...p, name: u.name, email: u.email, phone: u.phone } : p));
  };

  if (isLoading) return <div className="page-container"><p>Loading students...</p></div>;
  if (error) return <div className="page-container"><p className="error-message">Error: {error}</p></div>;

  const roleLabel = isAdmin ? 'Administrator' : isInstructor ? 'Instructor' : 'User';

  return (
      <div className="page-container">
        <div className={`role-indicator ${canManage ? 'admin' : 'user'}`}>
          <span>{roleLabel} View {canManage ? '- Full Management Access' : '- Limited Access'}</span>
        </div>

        <div className="students-controls">
          <div className="search-box">
            <input
                type="text"
                placeholder="Search by name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <label>Status:</label>
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {canManage && (
              <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                Add New Student
              </button>
          )}
        </div>

        <ConfirmModal
            isOpen={isConfirmOpen}
            message={`Are you sure you want to delete ${studentToDelete?.name || 'this student'}?`}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
        />

        <AddStudentModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddStudentSubmit}
            submitError={addStudentError}
        />

        <div className="students-table-container">
          <table className="students-table">
            <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Last Lesson</th>
              <th>Next Lesson</th>
              {canManage && <th>Actions</th>}
            </tr>
            </thead>
            <tbody>
            {visibleStudents.length > 0 ? (
                visibleStudents.map((student) => (
                    <tr key={student.id}>
                      <td onClick={() => handleStudentClick(student)}>{student.name}</td>
                      <td onClick={() => handleStudentClick(student)}>{student.email}</td>
                      <td onClick={() => handleStudentClick(student)}>{student.phone}</td>
                      <td onClick={() => handleStudentClick(student)}>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${student.progress}%` }} />
                          <span>{student.progress}%</span>
                        </div>
                      </td>
                      <td onClick={() => handleStudentClick(student)}>
                    <span className={`status-badge ${student.status}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                      </td>
                      <td onClick={() => handleStudentClick(student)}>{student.lastLesson || 'N/A'}</td>
                      <td onClick={() => handleStudentClick(student)}>{student.nextLesson || 'N/A'}</td>
                      {canManage && (
                          <td>
                            <button
                                className="btn-secondary"
                                onClick={(e) => { e.stopPropagation(); openEdit(student); }}
                            >
                              Edit
                            </button>
                            {isAdmin && (
                                <button
                                    className="btn-danger"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(student); }}
                                    style={{ marginLeft: 8 }}
                                >
                                  Delete
                                </button>
                            )}
                          </td>
                      )}
                    </tr>
                ))
            ) : (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center' }}>
                    No students found.
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>

        {selectedStudent && (
            <div className="student-details-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>
                    {selectedStudent.name}{' '}
                    {lessons && (
                      <span style={{ fontSize: '0.6em', color: '#777' }}>
                        ({lessons.total}/28 hodin)
                      </span>
                    )}
                  </h2>
                  <button className="btn-close" onClick={closeStudentDetails}>×</button>
                </div>


                <div className="modal-body">
                  {lessonsLoading && <div>Loading…</div>}
                  {lessonsError && <div className="error-message">{lessonsError}</div>}

                  {!lessonsLoading && !lessonsError && (
                      <>
                        <h3 style={{ marginTop: 0 }}>Budoucí lekce</h3>
                        <table className="students-table" style={{ marginBottom: 16 }}>
                          <thead>
                          <tr><th>Začátek</th><th>Konec</th><th>Typ</th><th>Poznámka</th></tr>
                          </thead>
                          <tbody>
                          {lessons?.classes
                              ?.filter(c => Date.parse(c.endsAt) >= Date.now())
                              .sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
                              .map(c => (
                                  <tr key={c.id}>
                                    <td>{fmt(c.startsAt)}</td>
                                    <td>{fmt(c.endsAt)}</td>
                                    <td>{c.type || '—'}</td>
                                    <td>{c.note || '—'}</td>
                                  </tr>
                              ))}
                          {(!lessons || lessons.classes.filter(c=>Date.parse(c.endsAt) >= Date.now()).length === 0) && (
                              <tr><td colSpan={4}>Žádné lekce</td></tr>
                          )}
                          </tbody>
                        </table>

                        <h3>Minulé lekce</h3>
                        <table className="students-table">
                          <thead>
                          <tr><th>Začátek</th><th>Konec</th><th>Typ</th><th>Poznámka</th></tr>
                          </thead>
                          <tbody>
                          {lessons?.classes
                              ?.filter(c => Date.parse(c.endsAt) < Date.now())
                              .sort((a,b)=>Date.parse(b.startsAt)-Date.parse(a.startsAt))
                              .map(c => (
                                  <tr key={c.id}>
                                    <td>{fmt(c.startsAt)}</td>
                                    <td>{fmt(c.endsAt)}</td>
                                    <td>{c.type || '—'}</td>
                                    <td>{c.note || '—'}</td>
                                  </tr>
                              ))}
                          {(!lessons || lessons.classes.filter(c=>Date.parse(c.endsAt) < Date.now()).length === 0) && (
                              <tr><td colSpan={4}>Žádné lekce</td></tr>
                          )}
                          </tbody>
                        </table>
                      </>
                  )}
                </div>
              </div>
            </div>
        )}

        <EditStudentModal
            isOpen={isEditOpen}
            onClose={closeEdit}
            student={
              studentToEdit
                  ? { id: studentToEdit.id, name: studentToEdit.name, email: studentToEdit.email, phone: studentToEdit.phone }
                  : null
            }
            onSaved={onEdited}
        />
      </div>
  );
};

export default Students;