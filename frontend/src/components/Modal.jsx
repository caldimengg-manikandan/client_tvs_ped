import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, data }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto flex items-center justify-center z-modal p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 relative">
                <div className="flex items-center justify-between p-6 border-b border-tvs-border">
                    <h2 className="text-xl font-bold text-tvs-dark-gray">{title}</h2>
                    <button className="text-gray-400 hover:text-tvs-red transition-colors p-1 rounded-full hover:bg-gray-50 cursor-pointer" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <div className="space-y-3">
                        {data && data.length > 0 ? (
                            data.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                                    <span className="text-gray-600 font-medium text-sm">{item.label}</span>
                                    <span className="font-bold text-tvs-blue">{item.value}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No details available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
