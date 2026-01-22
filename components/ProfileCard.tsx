import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { updateUserNotes, updateUserLanguage, updateUser } from '../services/dataService';
import { Edit2, Lock, Eye, EyeOff, Save, Globe, Calendar, Copy, Check } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';

const SUPPORTED_LANGUAGES = [
    'English',
    'Vietnamese',
    'Korean',
    'Japanese',
    'Chinese',
    'French',
    'Russian'
];

interface ProfileCardProps {
    user: User;
    onUserUpdate?: (updatedUser: User) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onUserUpdate }) => {
    const { t, language, setLanguage: setContextLanguage } = useTranslation();
    const toast = useToast();

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileName, setProfileName] = useState(user.lastName || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [notes, setNotes] = useState(user.notes || '');
    const [isSaving, setIsSaving] = useState(false);

    const [selectedLang, setSelectedLang] = useState(language || 'English');
    const [isLangSaving, setIsLangSaving] = useState(false);

    const [savedCheckInCode, setSavedCheckInCode] = useState<string | null>(null);
    const [codeCopied, setCodeCopied] = useState(false);

    useEffect(() => {
        const savedCode = localStorage.getItem('guest_check_in_code');
        const savedRoom = localStorage.getItem('guest_room_number');
        if (savedCode && savedRoom === user.roomNumber) {
            setSavedCheckInCode(savedCode);
        }
    }, [user.roomNumber]);

    const handleCopyCode = async () => {
        if (savedCheckInCode) {
            try {
                await navigator.clipboard.writeText(savedCheckInCode);
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
            } catch (error) {
                console.error('Failed to copy code:', error);
                toast.error('Failed to copy code. Please try again.');
            }
        }
    };

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            await updateUserNotes(user.roomNumber, notes);
            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                parsedUser.notes = notes;
                localStorage.setItem('furama_user', JSON.stringify(parsedUser));
                onUserUpdate?.(parsedUser);
            }
            toast.success('Notes saved successfully!');
        } catch (error) {
            console.error('Failed to save notes:', error);
            toast.error('Failed to save notes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user.id) {
            toast.error(t('error_user_id_not_found') || 'User ID not found');
            return;
        }

        if (newPassword || confirmPassword) {
            if (!currentPassword) {
                toast.warning('Please enter your current password to change password');
                return;
            }
            if (newPassword.length < 4) {
                toast.warning('New password must be at least 4 characters');
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.warning('New passwords do not match');
                return;
            }
        }

        setIsSavingProfile(true);
        try {
            const updateData: Partial<User> = {};
            if (profileName !== user.lastName) {
                updateData.lastName = profileName;
            }
            if (newPassword) {
                updateData.password = newPassword;
            }

            await updateUser(user.id, updateData);

            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                if (updateData.lastName) parsedUser.lastName = profileName;
                if (updateData.password) parsedUser.password = newPassword;
                localStorage.setItem('furama_user', JSON.stringify(parsedUser));
                onUserUpdate?.(parsedUser);
            }

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsEditingProfile(false);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            const baseMessage = t('error_update_profile_failed') || 'Failed to update profile.';
            toast.error(`${baseMessage} ${error.message ? `(${error.message})` : ''}`);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleLanguageChange = async (newLang: string) => {
        setSelectedLang(newLang);
        setIsLangSaving(true);

        try {
            await updateUserLanguage(user.roomNumber, newLang);

            const savedUser = localStorage.getItem('furama_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                parsedUser.language = newLang;
                localStorage.setItem('furama_user', JSON.stringify(parsedUser));
                onUserUpdate?.(parsedUser);
            }

            setContextLanguage(newLang as any);
            toast.success('Language updated successfully!');
        } catch (error: any) {
            console.error('Failed to update language:', error);
            toast.error('Failed to update language.');
        } finally {
            setIsLangSaving(false);
        }
    };

    return (
        <>
            {/* Profile Edit Card */}
            <div className="backdrop-blur-lg bg-white/95 p-3 rounded-3xl shadow-xl border border-white/60"
                style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Profile Settings</h4>
                    </div>
                    {!isEditingProfile && (
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                        >
                            <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                {isEditingProfile ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
                            <input
                                type="text"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                style={{ color: '#111827' }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full px-3 py-2 pr-10 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    style={{ color: '#111827' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 4 chars)"
                                    className="w-full px-3 py-2 pr-10 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    style={{ color: '#111827' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-3 py-2 pr-10 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                                    style={{ color: '#111827' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setIsEditingProfile(false);
                                    setProfileName(user.lastName || '');
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                disabled={isSavingProfile}
                                className="flex-1 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-lg"
                            >
                                {isSavingProfile ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        {t('save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-xs font-semibold text-gray-600">Name</span>
                            <span className="text-sm font-bold text-gray-800">{user.lastName || 'Not set'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-gray-100">
                            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <Lock size={12} />
                                Password
                            </span>
                            <span className="text-sm font-bold text-gray-800">••••••</span>
                        </div>
                        {savedCheckInCode && (
                            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                <span className="text-xs font-semibold text-gray-600">Check-in Code</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-emerald-700 font-mono tracking-wider">{savedCheckInCode}</span>
                                    <button
                                        onClick={handleCopyCode}
                                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                        title="Copy code"
                                    >
                                        {codeCopied ? (
                                            <Check size={14} className="text-emerald-600" />
                                        ) : (
                                            <Copy size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reservation Details Card */}
            <div className="backdrop-blur-lg bg-white/95 p-3 rounded-3xl shadow-xl border border-white/60"
                style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('reservation_details')}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-2.5 rounded-xl border border-blue-100">
                        <p className="text-xs text-gray-600 font-medium mb-1">{t('villa_type')}</p>
                        <p className="font-bold text-gray-800 text-sm">{user.villaType || 'Standard Room'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-2.5 rounded-xl border border-purple-100">
                        <p className="text-xs text-gray-600 font-medium mb-1">{t('stay_duration')}</p>
                        <p className="font-bold text-gray-800 text-sm">
                            {user.checkIn && user.checkOut ? (
                                <>
                                    {new Date(user.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(user.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </>
                            ) : user.checkIn ? (
                                <>
                                    {new Date(user.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - N/A
                                </>
                            ) : user.checkOut ? (
                                <>
                                    N/A - {new Date(user.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </>
                            ) : (
                                'N/A - N/A'
                            )}
                        </p>
                    </div>

                    {/* Language Selector */}
                    <div className="col-span-2 mt-2 pt-3 border-t-2 border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
                                <Globe size={14} className="text-emerald-600" />
                                {t('app_language')}
                            </p>
                            {isLangSaving && (
                                <span className="text-[10px] text-emerald-600 font-bold animate-pulse bg-emerald-50 px-2 py-1 rounded-full">
                                    Updating...
                                </span>
                            )}
                        </div>
                        <select
                            value={selectedLang}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                paddingRight: '40px',
                                backgroundColor: '#ffffff'
                            }}
                        >
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <option
                                    key={lang}
                                    value={lang}
                                    style={{ backgroundColor: '#ffffff', color: '#111827' }}
                                >
                                    {lang}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Personal Notes */}
            <div className="backdrop-blur-lg bg-white/95 p-5 rounded-3xl shadow-xl border border-white/60"
                style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
            >
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('personal_notes')}</h4>
                    </div>
                    {isSaving && (
                        <span className="text-xs text-emerald-600 font-bold animate-pulse bg-emerald-50 px-2 py-1 rounded-full">
                            Saved!
                        </span>
                    )}
                </div>
                <textarea
                    className="w-full bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none transition-all caret-yellow-600"
                    style={{ caretColor: '#d97706' }}
                    rows={3}
                    placeholder="e.g. Extra pillows, No nuts in food..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                ></textarea>
                <button
                    onClick={handleSaveNotes}
                    className="group relative mt-3 w-full py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 font-bold text-xs rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-all border-2 border-emerald-200 hover:border-emerald-300 flex items-center justify-center shadow-md"
                >
                    <Save size={14} className="mr-1.5" />
                    {t('save_notes')}
                </button>
            </div>
        </>
    );
};
