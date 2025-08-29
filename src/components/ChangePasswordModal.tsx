import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (passwords: { current: string; new: string; confirm: string }) => void;
    passwords: { current: string; new: string; confirm: string };
    setPasswords: React.Dispatch<React.SetStateAction<{ current: string; new: string; confirm: string }>>;
}

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose, onSave, passwords, setPasswords }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Change Password</h2>

                <input
                    type="password"
                    placeholder="Current Password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="New Password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />

                <div className="modal-actions">
                    <button className="btn-primary" onClick={() => onSave(passwords)}>
                        Save Password
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;