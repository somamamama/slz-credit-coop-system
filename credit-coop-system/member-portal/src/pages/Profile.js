import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({});
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        user_id: user.user_id || user.userId || null,
        name: user.user_name || user.name || '',
        email: user.user_email || user.email || '',
        member_number: user.member_number || user.memberNumber || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('memberPortalToken');
      // Only send allowed fields (members are not permitted to change member_number)
      const payload = {
        user_id: form.user_id,
        name: form.name,
        email: form.email
      };

      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update profile');
      }

      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated');
        if (data.user) updateUser(data.user);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error', err);
      toast.error(err.message || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('memberPortalToken');
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to change password');
      }

      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error', err);
      toast.error(err.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Header />
      <main className="container profile-main">
        <h2>My Profile</h2>

        <section className="profile-card card">
          <form onSubmit={saveProfile} className="profile-form">
            <div className="form-row">
              <label>Member Number</label>
              <div className="readonly-field">{form.member_number || '—'}</div>
            </div>

            <div className="form-row">
              <label>Full name</label>
              <input name="name" value={form.name || ''} onChange={handleChange} />
            </div>

            <div className="form-row">
              <label>Email</label>
              <input name="email" value={form.email || ''} onChange={handleChange} />
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>Save changes</button>
            </div>
          </form>
        </section>

        <section className="profile-card card">
          <h3>Change Password</h3>
          <form onSubmit={changePassword} className="profile-form">
            <div className="form-row">
              <label>Current password</label>
              <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} />
            </div>
            <div className="form-row">
              <label>New password</label>
              <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} />
            </div>
            <div className="form-row">
              <label>Confirm new password</label>
              <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" type="submit" disabled={saving}>Change password</button>
            </div>
          </form>
        </section>

      </main>
    </div>
  );
};

export default Profile;
