import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, Loader2, RefreshCw } from 'lucide-react';
import { MenuItem } from '../../../types';
import { addMenuItem, updateMenuItem } from '../../../services/dataService';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../contexts/LanguageContext';

interface MenuTabProps {
    menu: MenuItem[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
}

export const MenuTab: React.FC<MenuTabProps> = ({ menu, onDelete, onRefresh }) => {
    const toast = useToast();
    const { t } = useTranslation();
    const [menuFilter, setMenuFilter] = useState<'ALL' | 'Dining' | 'Spa' | 'Pool' | 'Butler'>('ALL');
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
    const [showMenuItemForm, setShowMenuItemForm] = useState(false);
    const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({ name: '', price: 0, category: 'Dining', description: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    const filteredMenu = useMemo(() => {
        return menuFilter === 'ALL' ? menu : menu.filter(m => m.category === menuFilter);
    }, [menu, menuFilter]);

    const handleSave = async () => {
        if (!newMenuItem.name) {
            toast.error(t('admin_error_required'));
            return;
        }
        if (!newMenuItem.price || newMenuItem.price <= 0) {
            toast.error(t('admin_error_invalid'));
            return;
        }
        setIsSaving(true);
        try {
            if (editingMenuItem && editingMenuItem.id) {
                await updateMenuItem(editingMenuItem.id, newMenuItem as MenuItem);
                setEditingMenuItem(null);
                toast.success(`"${newMenuItem.name}" ${t('admin_success_updated')}`);
            } else {
                await addMenuItem(newMenuItem as MenuItem);
                toast.success(`"${newMenuItem.name}" ${t('admin_success_added')}`);
            }
            setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
            setShowMenuItemForm(false);
            await onRefresh();
        } catch (error) {
            console.error('Failed to save menu item:', error);
            toast.error(t('admin_error_save'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">{t('admin_menu_management')}</h2>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button onClick={() => setMenuFilter('ALL')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'ALL' ? 'bg-gray-100 text-gray-800 font-bold' : 'text-gray-500'}`}>{t('admin_filter_all')}</button>
                        <button onClick={() => setMenuFilter('Dining')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Dining' ? 'bg-orange-100 text-orange-800 font-bold' : 'text-gray-500'}`}>{t('admin_filter_dining')}</button>
                        <button onClick={() => setMenuFilter('Spa')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Spa' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-500'}`}>{t('admin_filter_spa')}</button>
                        <button onClick={() => setMenuFilter('Pool')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Pool' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-500'}`}>{t('admin_filter_pool')}</button>
                        <button onClick={() => setMenuFilter('Butler')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Butler' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-gray-500'}`}>{t('admin_filter_butler')}</button>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-70"
                        title={t('admin_refresh')}
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => {
                            setShowMenuItemForm(!showMenuItemForm);
                            if (!showMenuItemForm) {
                                setEditingMenuItem(null);
                                setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                            }
                        }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md flex-1 md:flex-none"
                    >
                        {showMenuItemForm && !editingMenuItem ? <X size={18} /> : <Plus size={18} />}
                        <span>{showMenuItemForm && !editingMenuItem ? t('admin_cancel') : t('admin_add_item')}</span>
                    </button>
                </div>
            </div>

            {/* Menu Item Edit Modal */}
            {showMenuItemForm && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => {
                        setEditingMenuItem(null);
                        setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                        setShowMenuItemForm(false);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-2xl p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setEditingMenuItem(null);
                                setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                setShowMenuItemForm(false);
                            }}
                            className="absolute top-4 right-4 text-gray-500"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 pr-8">{editingMenuItem ? 'Edit Menu Item' : 'Create Menu Item'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newMenuItem.name || ''}
                                    onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                                    placeholder="e.g. Grilled Salmon"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newMenuItem.price || ''}
                                    onChange={e => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g. 25.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newMenuItem.category || 'Dining'}
                                    onChange={e => setNewMenuItem({ ...newMenuItem, category: e.target.value as 'Dining' | 'Spa' | 'Pool' | 'Butler' })}
                                >
                                    <option value="Dining">Dining</option>
                                    <option value="Spa">Spa</option>
                                    <option value="Pool">Pool</option>
                                    <option value="Butler">Butler</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                    value={newMenuItem.description || ''}
                                    onChange={e => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                                    placeholder="e.g. Fresh Atlantic salmon with lemon butter sauce"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setEditingMenuItem(null);
                                    setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                    setShowMenuItemForm(false);
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-70 flex items-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingMenuItem ? 'Update Item' : 'Create Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600">Item Details</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Category</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Price</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMenu.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 bg-white">
                                <td className="p-4">
                                    <div className="font-medium text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-400 line-clamp-1">{item.description}</div>
                                    {item.translations && <div className="text-[10px] text-emerald-600 mt-0.5">Translated: {Object.keys(item.translations).length} languages</div>}
                                </td>
                                <td className="p-4 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.category === 'Dining' ? 'bg-orange-100 text-orange-700' :
                                        item.category === 'Spa' ? 'bg-purple-100 text-purple-700' :
                                            item.category === 'Pool' ? 'bg-blue-100 text-blue-700' :
                                                item.category === 'Butler' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                        {item.category}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-sm font-bold text-emerald-600">${item.price}</td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1 relative z-10">
                                        <button
                                            onClick={() => {
                                                setEditingMenuItem(item);
                                                setNewMenuItem({
                                                    name: item.name,
                                                    price: item.price,
                                                    category: item.category,
                                                    description: item.description || ''
                                                });
                                                setShowMenuItemForm(true);
                                            }}
                                            className="text-emerald-600 p-2 relative z-10 cursor-pointer"
                                            title="Edit"
                                            type="button"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => onDelete(item.id)} className="text-red-500 p-2 relative z-10 cursor-pointer" type="button"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};
