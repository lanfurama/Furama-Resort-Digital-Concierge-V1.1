import React, { useState } from 'react';
import { Plus, Trash2, FileText, X, Edit2, Calendar, Tag, Image as ImageIcon } from 'lucide-react';
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
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="text-emerald-600" size={24} />
                        Active Promotions
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{promotions.length} promotion{promotions.length !== 1 ? 's' : ''} active</p>
                </div>
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
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transition-all duration-200 flex-1 md:flex-none font-semibold"
                >
                    {showPromotionForm && !editingPromotion ? (
                        <>
                            <X size={18} />
                            <span>Cancel</span>
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            <span>Add Promotion</span>
                        </>
                    )}
                </button>
            </div>

            {/* Promotion Edit Form */}
            {showPromotionForm && (
                <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-emerald-100 mb-6 animate-in slide-in-from-top-2" data-promo-form>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {editingPromotion ? (
                                <>
                                    <Edit2 size={20} className="text-emerald-600" />
                                    Edit Promotion
                                </>
                            ) : (
                                <>
                                    <Plus size={20} className="text-emerald-600" />
                                    Create New Promotion
                                </>
                            )}
                        </h3>
                        {editingPromotion && (
                            <button
                                onClick={() => {
                                    setEditingPromotion(null);
                                    setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                                    setShowPromotionForm(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Tag size={16} className="text-emerald-600" />
                                Title *
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                value={newPromotion.title || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, title: e.target.value })}
                                placeholder="e.g. Early Bird Special, Happy Hour"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                            <textarea
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                                value={newPromotion.description || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, description: e.target.value })}
                                placeholder="Describe the promotion details..."
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Tag size={16} className="text-emerald-600" />
                                Discount/Offer *
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                value={newPromotion.discount || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, discount: e.target.value })}
                                placeholder="e.g. 30% OFF, From $45"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-emerald-600" />
                                Valid Until *
                            </label>
                            <input
                                type="text"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                value={newPromotion.validUntil || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, validUntil: e.target.value })}
                                placeholder="e.g. Dec 31, Daily 14:00-16:00"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <ImageIcon size={16} className="text-emerald-600" />
                                Image URL (Optional)
                            </label>
                            <input
                                type="url"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                value={newPromotion.imageUrl || ''}
                                onChange={e => setNewPromotion({ ...newPromotion, imageUrl: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tag Color</label>
                            <select
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                value={newPromotion.imageColor || 'bg-emerald-500'}
                                onChange={e => setNewPromotion({ ...newPromotion, imageColor: e.target.value })}
                            >
                                <option value="bg-emerald-500">Emerald Green</option>
                                <option value="bg-blue-500">Blue</option>
                                <option value="bg-purple-500">Purple</option>
                                <option value="bg-orange-500">Orange</option>
                                <option value="bg-pink-500">Pink</option>
                                <option value="bg-cyan-500">Cyan</option>
                                <option value="bg-red-500">Red</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        {editingPromotion && (
                            <button
                                onClick={() => {
                                    setEditingPromotion(null);
                                    setNewPromotion({ title: '', description: '', discount: '', validUntil: '', imageColor: 'bg-emerald-500', imageUrl: '' });
                                    setShowPromotionForm(false);
                                }}
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                        </button>
                    </div>
                </div>
            )}

            {/* Promotions List */}
            {promotions.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 p-12 text-center">
                    <Tag size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Promotions Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Create your first promotion to attract more guests</p>
                    <button
                        onClick={() => setShowPromotionForm(true)}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Your First Promotion
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {promotions.map((promo) => (
                            <div 
                                key={promo.id} 
                                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group"
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    {/* Discount Tag */}
                                    <div className={`flex-shrink-0 w-20 h-20 ${promo.imageColor || 'bg-emerald-500'} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                                        <div className="text-center px-2">
                                            <div className="leading-tight">{promo.discount || 'N/A'}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Promotion Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1.5 group-hover:text-emerald-700 transition-colors">
                                            {promo.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                            {promo.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar size={14} className="text-emerald-600" />
                                            <span className="font-medium">Valid: {promo.validUntil}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
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
                                            // Scroll to form
                                            setTimeout(() => {
                                                const formElement = document.querySelector('[data-promo-form]');
                                                if (formElement) {
                                                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }, 100);
                                        }}
                                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                                        title="Edit Promotion"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete "${promo.title}"?`)) {
                                                onDelete(promo.id);
                                            }
                                        }} 
                                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                                        title="Delete Promotion"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
