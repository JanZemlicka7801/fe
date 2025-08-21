import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get<User[]>('http://localhost:8080/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`http://localhost:8080/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      await axios.put(
          `http://localhost:8080/api/users/${userId}/role`,
          { role: newRole },
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleStatusChange = async (
      userId: string,
      newStatus: 'active' | 'inactive' | 'suspended'
  ) => {
    try {
      await axios.put(
          `http://localhost:8080/api/users/${userId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, status: newStatus } : user))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
      <div className="page-container">
        <h1 className="page-title">User Management</h1>

        <div className="user-controls">
          <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
            <p>Loading users...</p>
        ) : filteredUsers.length === 0 ? (
            <p>No users found.</p>
        ) : (
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
              {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                          value={user.role}
                          onChange={(e) =>
                              handleRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')
                          }
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                          value={user.status}
                          onChange={(e) =>
                              handleStatusChange(
                                  user.id,
                                  e.target.value as 'active' | 'inactive' | 'suspended'
                              )
                          }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td>{user.createdAt}</td>
                    <td>
                      <button onClick={() => handleDeleteUser(user.id)}>🗑️ Delete</button>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
        )}
      </div>
  );
};

export default UserManagement;