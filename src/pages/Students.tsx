import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchStudents,
  addStudent,
  deleteStudent, // <-- IMPORTED HERE
  StudentCreateDTO
} from '../services/StudentService';
import AddStudentModal from '../components/AddStudentModal';
import ConfirmModal from '../components/ConfirmModal';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  progress: number;
  status: 'active' | 'inactive' | 'completed';
  lastLesson: string | null;
  nextLesson: string | null;
}

const Students: React.FC = () => {
  const { isAdmin, token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const getStudents = async () => {
      if (!token) {
        setError("Authentication token not available.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchStudents(token);
        setStudents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getStudents();
  }, [token]);

  const handleAddStudentSubmit = async (studentData: StudentCreateDTO) => {
    if (!token) {
      setAddStudentError("Authentication token not available.");
      return;
    }

    setAddStudentError(null);
    try {
      const addedStudent = await addStudent(studentData, token);
      setStudents(prevStudents => [...prevStudents, addedStudent]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddStudentError(err.message);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
        (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !studentToDelete) return;

    try {
      await deleteStudent(studentToDelete.id, token);
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
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

  if (isLoading) {
    return <div className="page-container"><p>Loading students...</p></div>;
  }

  if (error) {
    return <div className="page-container"><p className="error-message">Error: {error}</p></div>;
  }

  return (
      <div className="page-container">
        <h1 className="page-title">Students</h1>

        {isAdmin ? (
            <div className="role-indicator admin">
              <span>Administrator View - Full Management Access</span>
            </div>
        ) : (
            <div className="role-indicator user">
              <span>User View - Limited Access</span>
            </div>
        )}

        <div className="students-controls">
          <div className="search-box">
            <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <label>Status:</label>
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {isAdmin && (
              <button
                  className="btn-primary"
                  onClick={() => setIsAddModalOpen(true)}
              >
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
              {isAdmin && <th>Actions</th>}
            </tr>
            </thead>
            <tbody>
            {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                    <tr key={index}>
                      <td onClick={() => handleStudentClick(student)}>{student.name}</td>
                      <td onClick={() => handleStudentClick(student)}>{student.email}</td>
                      <td onClick={() => handleStudentClick(student)}>{student.phone}</td>
                      <td onClick={() => handleStudentClick(student)}>
                        <div className="progress-bar-container">
                          <div
                              className="progress-bar"
                              style={{ width: `${student.progress}%` }}
                          ></div>
                          <span>{student.progress}%</span>
                        </div>
                      </td>
                      <td onClick={() => handleStudentClick(student)}>
              <span className={`status-badge ${student.status || ''}`}>
                {(student.status || '').charAt(0).toUpperCase() +
                    (student.status || '').slice(1)}
              </span>
                      </td>
                      <td onClick={() => handleStudentClick(student)}>
                        {student.lastLesson || 'N/A'}
                      </td>
                      <td onClick={() => handleStudentClick(student)}>
                        {student.nextLesson || 'N/A'}
                      </td>

                      {isAdmin && (
                          <td>
                            <button
                                className="btn-danger"
                                onClick={() => handleDeleteClick(student)}
                            >
                              Delete
                            </button>
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
                  <h2>{selectedStudent.name}</h2>
                  <button className="btn-close" onClick={closeStudentDetails}>×</button>
                </div>
                <div className="modal-body">
                  <div className="student-info">
                    <div className="info-group">
                      <h3>Contact Information</h3>
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{selectedStudent.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{selectedStudent.phone}</span>
                      </div>
                    </div>

                    <div className="info-group">
                      <h3>Progress</h3>
                      <div className="progress-bar-container large">
                        <div
                            className="progress-bar"
                            style={{ width: `${selectedStudent.progress}%` }}
                        ></div>
                        <span>{selectedStudent.progress}%</span>
                      </div>
                    </div>

                    <div className="info-group">
                      <h3>Lesson Schedule</h3>
                      <div className="info-item">
                        <span className="info-label">Last Lesson:</span>
                        <span className="info-value">{selectedStudent.lastLesson || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Next Lesson:</span>
                        <span className="info-value">{selectedStudent.nextLesson || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default Students;