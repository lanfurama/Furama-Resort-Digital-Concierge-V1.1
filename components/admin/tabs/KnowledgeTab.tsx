import React, { useState } from 'react';
import { Plus, Trash2, FileText, X } from 'lucide-react';
import { KnowledgeItem } from '../../../types';
import { addKnowledgeItem, updateKnowledgeItem, getKnowledgeBase } from '../../../services/dataService';

interface KnowledgeTabProps {
    knowledge: KnowledgeItem[];
    onDelete: (id: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    setKnowledge: (knowledge: KnowledgeItem[]) => void;
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ knowledge, onDelete, onRefresh, setKnowledge }) => {
    const [editingKnowledgeItem, setEditingKnowledgeItem] = useState<KnowledgeItem | null>(null);
    const [showKnowledgeForm, setShowKnowledgeForm] = useState(false);
    const [newKnowledgeItem, setNewKnowledgeItem] = useState<Partial<KnowledgeItem>>({ question: '', answer: '' });

    const handleSave = async () => {
        if (!newKnowledgeItem.question || !newKnowledgeItem.answer) {
            alert('Please fill in both question and answer.');
            return;
        }
        try {
            if (editingKnowledgeItem) {
                const updated = await updateKnowledgeItem(editingKnowledgeItem.id, newKnowledgeItem as KnowledgeItem);
                alert(`Knowledge item "${updated.question}" updated successfully!`);
                setEditingKnowledgeItem(null);
            } else {
                await addKnowledgeItem(newKnowledgeItem as KnowledgeItem);
                alert(`Knowledge item "${newKnowledgeItem.question}" created successfully!`);
            }
            setNewKnowledgeItem({ question: '', answer: '' });
            setShowKnowledgeForm(false);
            try {
                const refreshedKnowledge = await getKnowledgeBase();
                setKnowledge(refreshedKnowledge);
            } catch (error) {
                console.error('Failed to refresh knowledge:', error);
            }
            await onRefresh();
        } catch (error: any) {
            console.error('Failed to save knowledge item:', error);
            alert(`Failed to save knowledge item: ${error?.message || 'Unknown error'}`);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">AI Chatbot Knowledge Base</h2>
                <button
                    onClick={() => {
                        if (showKnowledgeForm && !editingKnowledgeItem) {
                            setShowKnowledgeForm(false);
                            setNewKnowledgeItem({ question: '', answer: '' });
                        } else {
                            setShowKnowledgeForm(!showKnowledgeForm);
                            if (!showKnowledgeForm) {
                                setEditingKnowledgeItem(null);
                                setNewKnowledgeItem({ question: '', answer: '' });
                            }
                        }
                    }}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md transition flex-1 md:flex-none"
                >
                    {showKnowledgeForm && !editingKnowledgeItem ? <X size={18} /> : <Plus size={18} />}
                    <span>{showKnowledgeForm && !editingKnowledgeItem ? 'Cancel' : 'Add Knowledge'}</span>
                </button>
            </div>

            {/* Knowledge Edit Form */}
            {showKnowledgeForm && (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-emerald-100 mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">{editingKnowledgeItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}</h3>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Question</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newKnowledgeItem.question || ''}
                                onChange={e => setNewKnowledgeItem({ ...newKnowledgeItem, question: e.target.value })}
                                placeholder="e.g. What is the check-out time?"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Answer</label>
                            <textarea
                                className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 text-gray-900"
                                value={newKnowledgeItem.answer || ''}
                                onChange={e => setNewKnowledgeItem({ ...newKnowledgeItem, answer: e.target.value })}
                                placeholder="e.g. Check-out time is 12:00 PM."
                                rows={4}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {editingKnowledgeItem && (
                            <button
                                onClick={() => {
                                    setEditingKnowledgeItem(null);
                                    setNewKnowledgeItem({ question: '', answer: '' });
                                    setShowKnowledgeForm(false);
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
                            {editingKnowledgeItem ? 'Update Knowledge Item' : 'Create Knowledge Item'}
                        </button>
                    </div>
                </div>
            )}

            {/* Knowledge List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="divide-y divide-gray-100">
                    {knowledge.map((k) => (
                        <div key={k.id} className="p-4 flex justify-between items-start hover:bg-gray-50">
                            <div className="pr-4 flex-1">
                                <div className="font-semibold text-emerald-800 text-sm mb-1">Q: {k.question}</div>
                                <div className="text-gray-600 text-sm">A: {k.answer}</div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                        setEditingKnowledgeItem(k);
                                        setNewKnowledgeItem({
                                            question: k.question,
                                            answer: k.answer
                                        });
                                        setShowKnowledgeForm(true);
                                    }}
                                    className="text-emerald-600 hover:text-emerald-700 p-2"
                                    title="Edit"
                                >
                                    <FileText size={16} />
                                </button>
                                <button onClick={() => onDelete(k.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
