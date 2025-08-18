import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  progress: number;
  status: 'active' | 'inactive' | 'completed';
  lastLesson: string;
  nextLesson: string;
}

const mockStudents: Student[] = [
  {
    id: 1,
    name: 'Emma Johnson',
    email: 'emma.j@example.com',
    phone: '(555) 123-4567',
    progress: 75,
    status: 'active',
    lastLesson: '2025-08-10',
    nextLesson: '2025-08-17'
  },
  {
    id: 2,
    name: 'Michael Smith',
    email: 'michael.s@example.com',
    phone: '(555) 234-5678',
    progress: 45,
    status: 'active',
    lastLesson: '2025-08-12',
    nextLesson: '2025-08-19'
  },
  {
    id: 3,
    name: 'Sophia Williams',
    email: 'sophia.w@example.com',
    phone: '(555) 345-6789',
    progress: 90,
    status: 'active',
    lastLesson: '2025-08-14',
    nextLesson: '2025-08-21'
  },
  {
    id: 4,
    name: 'James Brown',
    email: 'james.b@example.com',
    phone: '(555) 456-7890',
    progress: 100,
    status: 'completed',
    lastLesson: '2025-08-05',
    nextLesson: ''
  },
  {
    id: 5,
    name: 'Olivia Davis',
    email: 'olivia.d@example.com',
    phone: '(555) 567-8901',
    progress: 60,
    status: 'active',
    lastLesson: '2025-08-11',
    nextLesson: '2025-08-18'
  },
  {
    id: 6,
    name: 'William Miller',
    email: 'william.m@example.com',
    phone: '(555) 678-9012',
    progress: 30,
    status: 'active',
    lastLesson: '2025-08-13',
    nextLesson: '2025-08-20'
  },
  {
    id: 7,
    name: 'Ava Wilson',
    email: 'ava.w@example.com',
    phone: '(555) 789-0123',
    progress: 15,
    status: 'active',
    lastLesson: '2025-08-15',
    nextLesson: '2025-08-22'
  },
  {
    id: 8,
    name: 'Ethan Moore',
    email: 'ethan.m@example.com',
    phone: '(555) 890-1234',
    progress: 0,
    status: 'inactive',
    lastLesson: '',
    nextLesson: '2025-08-20'
  }
];

const Students: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Students</h1>
      
      {/* Role-specific header */}
      {isAdmin && (
        <div className="role-indicator admin">
          <span>Administrator View - Full Management Access</span>
        </div>
      )}
      {!isAdmin && (
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
        
        {/* Only admins can add new students */}
        {isAdmin && (
          <button 
            className="btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Student
          </button>
        )}
      </div>
      
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id} onClick={() => handleStudentClick(student)}>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.phone}</td>
                <td>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${student.progress}%` }}
                    ></div>
                    <span>{student.progress}%</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${student.status}`}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                </td>
                <td>{student.lastLesson || 'N/A'}</td>
                <td>{student.nextLesson || 'N/A'}</td>
                <td>
                  {/* Admin has full control */}
                  {isAdmin && (
                    <>
                      <button className="btn-icon" title="Edit Student">📝</button>
                      <button className="btn-icon" title="Schedule Lesson">📅</button>
                      <button className="btn-icon" title="View Progress">📊</button>
                      <button className="btn-icon btn-icon-danger" title="Delete Student">🗑️</button>
                    </>
                  )}
                  
                  {/* Regular users can only view */}
                  {!isAdmin && (
                    <button className="btn-icon" title="View Details">👁️</button>
                  )}
                </td>
              </tr>
            ))}
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
              
              <div className="student-actions">
                {/* Admin has full control */}
                {isAdmin && (
                  <>
                    <button className="btn-primary">Schedule Lesson</button>
                    <button className="btn-secondary">View Progress Report</button>
                    <button className="btn-secondary">Edit Student</button>
                    <button className="btn-danger">Delete Student</button>
                  </>
                )}
                
                {/* Regular users have limited options */}
                {!isAdmin && (
                  <>
                    <button className="btn-primary">View Schedule</button>
                    <button className="btn-secondary">View Progress Report</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;