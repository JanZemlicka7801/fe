import React, { useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2025-01-15'
  },
  {
    id: '2',
    username: 'john.doe',
    email: 'john.doe@example.com',
    role: 'USER',
    status: 'active',
    createdAt: '2025-02-20'
  },
  {
    id: '3',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    role: 'USER',
    status: 'active',
    createdAt: '2025-03-10'
  },
  {
    id: '4',
    username: 'instructor1',
    email: 'instructor1@example.com',
    role: 'USER',
    status: 'active',
    createdAt: '2025-04-05'
  },
  {
    id: '5',
    username: 'student1',
    email: 'student1@example.com',
    role: 'USER',
    status: 'inactive',
    createdAt: '2025-05-12'
  },
  {
    id: '6',
    username: 'manager',
    email: 'manager@example.com',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2025-06-18'
  }
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleRoleChange = (userId: string, newRole: 'USER' | 'ADMIN') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  return (
    <div className="page-container">
      <h1 className="page-title">User Management</h1>
      
      <div className="user-management">
        <div className="user-controls">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <label>Role:</label>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          
          <div className="filter-box">
            <label>Status:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <button className="btn-primary">Add New User</button>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')}
                      className={`role-select ${user.role.toLowerCase()}`}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value as 'active' | 'inactive' | 'suspended')}
                      className={`status-select ${user.status}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td>{user.createdAt}</td>
                  <td>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      📝
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="no-results">
            <p>No users found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;