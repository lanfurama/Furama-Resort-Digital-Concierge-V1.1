import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { MenuItem } from '../../../types';
import { addMenuItem, updateMenuItem } from '../../../services/dataService';

interface MenuTabProps {
    menu: MenuItem[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
}

export const MenuTab: React.FC<MenuTabProps> = ({ menu, onDelete, onRefresh }) => {
    const [menuFilter, setMenuFilter] = useState<'ALL' | 'Dining' | 'Spa' | 'Pool' | 'Butler'>('ALL');
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
    const [showMenuItemForm, setShowMenuItemForm] = useState(false);
    const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({ name: '', price: 0, category: 'Dining', description: '' });

    const filteredMenu = useMemo(() => {
        return menuFilter === 'ALL' ? menu : menu.filter(m => m.category === menuFilter);
    }, [menu, menuFilter]);

    const handleSave = async () => {
        if (!newMenuItem.name) {
            alert('Please enter a name.');
            return;
        }
        if (!newMenuItem.price || newMenuItem.price <= 0) {
            alert('Please enter a valid price.');
            return;
        }
        try {
            if (editingMenuItem && editingMenuItem.id) {
                await updateMenuItem(editingMenuItem.id, newMenuItem as MenuItem);
                setEditingMenuItem(null);
                alert(`Menu item "${newMenuItem.name}" updated successfully!`);
            } else {
                await addMenuItem(newMenuItem as MenuItem);
                alert(`Menu item "${newMenuItem.name}" added successfully!`);
            }
            setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
            setShowMenuItemForm(false);
            await onRefresh();
        } catch (error) {
            console.error('Failed to save menu item:', error);
            alert('Failed to save menu item. Please try again.');
        }
    };

    return (
        <>
            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">Dining & Spa Menus</h2>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button onClick={() => setMenuFilter('ALL')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'ALL' ? 'bg-gray-100 text-gray-800 font-bold' : 'text-gray-500'}`}>All</button>
                        <button onClick={() => setMenuFilter('Dining')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Dining' ? 'bg-orange-100 text-orange-800 font-bold' : 'text-gray-500'}`}>Dining</button>
                        <button onClick={() => setMenuFilter('Spa')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Spa' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-500'}`}>Spa</button>
                        <button onClick={() => setMenuFilter('Pool')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Pool' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-500'}`}>Pool</button>
                        <button onClick={() => setMenuFilter('Butler')} className={`px-3 py-1 text-xs rounded ${menuFilter === 'Butler' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-gray-500'}`}>Butler</button>
                    </div>
                    <button
                        onClick={() => {
                            setShowMenuItemForm(!showMenuItemForm);
                            if (!showMenuItemForm) {
                                setEditingMenuItem(null);
                                setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                            }
                        }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md active:scale-95 flex-1 md:flex-none"
                    >
                        {showMenuItemForm && !editingMenuItem ? <X size={18} /> : <Plus size={18} />}
                        <span>{showMenuItemForm && !editingMenuItem ? 'Cancel' : 'Add Item'}</span>
                    </button>
                </div>
            </div>

            {/* Menu Item Edit Modal */}
            {showMenuItemForm && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                    onClick={() => {
                        setEditingMenuItem(null);
                        setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                        setShowMenuItemForm(false);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[90vw] max-w-2xl p-6 animate-in slide-in-from-top-5 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setEditingMenuItem(null);
                                setNewMenuItem({ name: '', price: 0, category: 'Dining', description: '' });
                                setShowMenuItemForm(false);
                            }}
                            className="absolute top-4 right-4 text-gray-500 active:scale-95"
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
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold active:scale-95"
                            >
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
                                            className="text-emerald-600 p-2 relative z-10 cursor-pointer active:scale-95"
                                            title="Edit"
                                            type="button"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => onDelete(item.id)} className="text-red-500 p-2 relative z-10 cursor-pointer active:scale-95" type="button"><Trash2 size={16} /></button>
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
