import React, { useState } from 'react';
import { Plus, Trash2, FileText, X } from 'lucide-react';
import { Promotion } from '../../../types';
import { addPromotion, updatePromotion, getPromotions } from '../../../services/dataService';

interface PromosTabProps {
    promotions: Promotion[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    setPromotions: (promotions: Promotion[]) => void;
}

export const PromosTab: React.FC<PromosTabProps> = ({ promotions, onDelete, onRefresh, setPromotions }) => {
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [showPromotionForm, setShowPromotionForm] = useState(false);
    const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });

    const handleSave = async () => {
        if (!newPromotion.title || !newPromotion.description || !newPromotion.discount || !newPromotion.validUntil) {
            alert('Please fill in all required fields.');
            return;
        }
        try {
            if (editingPromotion) {
                const updated = await updatePromotion(editingPromotion.id, newPromotion as Promotion);
                alert(`Promotion "${updated.title}" updated successfully!`);
                setEditingPromotion(null);
            } else {
                await addPromotion(newPromotion as Promotion);
                alert(`Promotion "${newPromotion.title}" created successfully!`);
            }
            setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
            setShowPromotionForm(false);
            try {
                const refreshedPromotions = await getPromotions();
                setPromotions(refreshedPromotions);
            } catch (error) {
                console.error('Failed to refresh promotions:', error);
            }
            await onRefresh();
        } catch (error: any) {
            console.error('Failed to save promotion:', error);
            alert(`Failed to save promotion: ${error?.message || 'Unknown error'}`);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">Active Promotions</h2>
                <button
                    onClick={() => {
                        if (showPromotionForm && !editingPromotion) {
                            setShowPromotionForm(false);
                            setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                        } else {
                            setShowPromotionForm(!showPromotionForm);
                            if (!showPromotionForm) {
                                setEditingPromotion(null);
                                setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                            }
                        }
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                >
                    {showPromotionForm && !editingPromotion ? <X size={18} /> : <Plus size={18} />}
                    <span>{showPromotionForm && !editingPromotion ? 'Cancel' : 'Add Promotion'}</span>
                </button>
            </div>

            {/* Promotion Edit Form */}
            {showPromotionForm && (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">{editingPromotion ? 'Edit Promotion' : 'Create Promotion'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newPromotion.title || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, title: e.target.value })}
                                placeholder="e.g. Happy Hour Special"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                            <textarea
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newPromotion.description || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, description: e.target.value })}
                                placeholder="e.g. Enjoy refreshing cocktails and light bites by the pool."
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Discount</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newPromotion.discount || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, discount: e.target.value })}
                                placeholder="e.g. 30% OFF"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Valid Until</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newPromotion.validUntil || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, validUntil: e.target.value })}
                                placeholder="e.g. Daily 14:00-16:00"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Image URL (Optional)</label>
                            <input
                                type="url"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newPromotion.imageUrl || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, imageUrl: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Image Color</label>
                            <select
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newPromotion.imageColor || 'bg-emerald-500'}
                                onChange={e => setNewPromotion({ ...newPromotion, imageColor: e.target.value })}
                            >
                                <option value="bg-emerald-500">Emerald</option>
                                <option value="bg-blue-500">Blue</option>
                                <option value="bg-purple-500">Purple</option>
                                <option value="bg-orange-500">Orange</option>
                                <option value="bg-pink-500">Pink</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {editingPromotion && (
                            <button
                                onClick={() => {
                                    setEditingPromotion(null);
                                    setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                                    setShowPromotionForm(false);
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm font-bold"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="bg-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-bold"
                        >
                            {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                        </button>
                    </div>
                </div>
            )}

            {/* Promotions List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="divide-y divide-gray-100">
                    {promotions.map((promo) => (
                        <div key={promo.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 ${promo.imageColor || 'bg-emerald-500'} rounded-lg flex items-center justify-center text-white font-bold text-xl`}>
                                    {promo.discount || 'N/A'}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">{promo.title}</div>
                                    <div className="text-sm text-gray-600">{promo.description}</div>
                                    <div className="text-xs text-emerald-600 mt-1">Valid: {promo.validUntil}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                        setEditingPromotion(promo);
                                        setNewPromotion({
                                            title: promo.title,
                                            description: promo.description,
                                            discount: promo.discount,
                                            validUntil: promo.validUntil,
                                            imageColor: promo.imageColor || 'bg-emerald-500',
                                            imageUrl: promo.imageUrl || ''
                                        });
                                        setShowPromotionForm(true);
                                    }}
                                    className="text-emerald-600 hover:text-emerald-700 p-2"
                                    title="Edit"
                                >
                                    <FileText size={16} />
                                </button>
                                <button onClick={() => onDelete(promo.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
