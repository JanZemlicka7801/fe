import { apiFetch } from './api';

// Define interfaces for different types of settings
export interface NotificationSettings {
  emailBookings: boolean;
  emailCancels: boolean;
  emailReminders: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
}

export interface SystemSettings {
  defaultInstructorId?: string;
  maxLessonsPerLearner?: number;
  allowWeekendBookings?: boolean;
  bookingLeadTimeHours?: number;
  cancellationLeadTimeHours?: number;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequencyDays: number;
  backupRetentionCount: number;
  lastBackupDate?: string;
}

export interface UserSettings {
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

export interface AdminSettings extends UserSettings {
  system: SystemSettings;
  backup: BackupSettings;
}

// Helper function to get settings from localStorage as fallback
function getLocalSettings<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Helper function to save settings to localStorage as fallback
function saveLocalSettings<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save settings to localStorage');
  }
}

// Default settings values
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailBookings: true,
  emailCancels: true,
  emailReminders: true,
};

const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: 'system',
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  defaultInstructorId: '11111111-1111-1111-1111-111111111111',
  maxLessonsPerLearner: 28,
  allowWeekendBookings: true,
  bookingLeadTimeHours: 24,
  cancellationLeadTimeHours: 12,
};

const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: false,
  backupFrequencyDays: 7,
  backupRetentionCount: 5,
  lastBackupDate: undefined,
};

// Settings service functions
export async function fetchUserSettings(token: string): Promise<UserSettings> {
  try {
    // Try to fetch from API
    const settings = await apiFetch<UserSettings>('settings/user', { token });
    
    // Save to localStorage as fallback
    saveLocalSettings('notificationSettings', settings.notifications);
    saveLocalSettings('theme', settings.appearance.theme);
    
    return settings;
  } catch (error) {
    // If API fails, use localStorage as fallback
    console.error('Failed to fetch settings from API, using localStorage fallback', error);
    
    return {
      notifications: getLocalSettings('notificationSettings', DEFAULT_NOTIFICATION_SETTINGS),
      appearance: {
        theme: getLocalSettings('theme', DEFAULT_APPEARANCE_SETTINGS.theme),
      },
    };
  }
}

export async function updateUserSettings(token: string, settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    // Try to update via API
    const updatedSettings = await apiFetch<UserSettings>('settings/user', { 
      method: 'PUT',
      token,
      body: settings,
    });
    
    // Save to localStorage as fallback
    if (settings.notifications) {
      saveLocalSettings('notificationSettings', updatedSettings.notifications);
    }
    if (settings.appearance) {
      saveLocalSettings('theme', updatedSettings.appearance.theme);
    }
    
    return updatedSettings;
  } catch (error) {
    // If API fails, update localStorage and return the settings that would have been saved
    console.error('Failed to update settings via API, using localStorage fallback', error);
    
    const currentSettings = await fetchUserSettings(token);
    const mergedSettings = {
      ...currentSettings,
      ...settings,
      notifications: {
        ...currentSettings.notifications,
        ...(settings.notifications || {}),
      },
      appearance: {
        ...currentSettings.appearance,
        ...(settings.appearance || {}),
      },
    };
    
    if (settings.notifications) {
      saveLocalSettings('notificationSettings', mergedSettings.notifications);
    }
    if (settings.appearance) {
      saveLocalSettings('theme', mergedSettings.appearance.theme);
    }
    
    return mergedSettings;
  }
}

export async function fetchAdminSettings(token: string): Promise<AdminSettings> {
  try {
    // Try to fetch from API
    const settings = await apiFetch<AdminSettings>('settings/admin', { token });
    
    // Save to localStorage as fallback
    saveLocalSettings('adminSettings', settings);
    
    return settings;
  } catch (error) {
    // If API fails, use localStorage as fallback
    console.error('Failed to fetch admin settings from API, using localStorage fallback', error);
    
    // Get user settings first
    const userSettings = await fetchUserSettings(token);
    
    // Then add admin-specific settings
    return {
      ...userSettings,
      system: getLocalSettings('systemSettings', DEFAULT_SYSTEM_SETTINGS),
      backup: getLocalSettings('backupSettings', DEFAULT_BACKUP_SETTINGS),
    };
  }
}

export async function updateAdminSettings(token: string, settings: Partial<AdminSettings>): Promise<AdminSettings> {
  try {
    // Try to update via API
    const updatedSettings = await apiFetch<AdminSettings>('settings/admin', { 
      method: 'PUT',
      token,
      body: settings,
    });
    
    // Save to localStorage as fallback
    saveLocalSettings('adminSettings', updatedSettings);
    
    return updatedSettings;
  } catch (error) {
    // If API fails, update localStorage and return the settings that would have been saved
    console.error('Failed to update admin settings via API, using localStorage fallback', error);
    
    const currentSettings = await fetchAdminSettings(token);
    const mergedSettings = {
      ...currentSettings,
      ...settings,
      notifications: {
        ...currentSettings.notifications,
        ...(settings.notifications || {}),
      },
      appearance: {
        ...currentSettings.appearance,
        ...(settings.appearance || {}),
      },
      system: {
        ...currentSettings.system,
        ...(settings.system || {}),
      },
      backup: {
        ...currentSettings.backup,
        ...(settings.backup || {}),
      },
    };
    
    saveLocalSettings('adminSettings', mergedSettings);
    
    if (settings.notifications) {
      saveLocalSettings('notificationSettings', mergedSettings.notifications);
    }
    if (settings.appearance) {
      saveLocalSettings('theme', mergedSettings.appearance.theme);
    }
    if (settings.system) {
      saveLocalSettings('systemSettings', mergedSettings.system);
    }
    if (settings.backup) {
      saveLocalSettings('backupSettings', mergedSettings.backup);
    }
    
    return mergedSettings;
  }
}

// Backup and restore functions for admin
export async function createBackup(token: string): Promise<{ id: string; date: string; size: number }> {
  try {
    return await apiFetch('settings/admin/backup', { 
      method: 'POST',
      token,
    });
  } catch (error) {
    console.error('Failed to create backup', error);
    throw error;
  }
}

export async function restoreBackup(token: string, backupId: string): Promise<{ success: boolean; message: string }> {
  try {
    return await apiFetch(`settings/admin/restore/${backupId}`, { 
      method: 'POST',
      token,
    });
  } catch (error) {
    console.error('Failed to restore backup', error);
    throw error;
  }
}

export async function listBackups(token: string): Promise<Array<{ id: string; date: string; size: number }>> {
  try {
    return await apiFetch('settings/admin/backups', { token });
  } catch (error) {
    console.error('Failed to list backups', error);
    throw error;
  }
}

export async function deleteBackup(token: string, backupId: string): Promise<{ success: boolean }> {
  try {
    return await apiFetch(`settings/admin/backups/${backupId}`, { 
      method: 'DELETE',
      token,
    });
  } catch (error) {
    console.error('Failed to delete backup', error);
    throw error;
  }
}