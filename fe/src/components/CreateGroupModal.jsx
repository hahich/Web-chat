import React, { useEffect, useMemo, useRef, useState } from 'react'

const CreateGroupModal = ({ isOpen, onClose, onCreate, users = [] }) => {
    const [name, setName] = useState("");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(new Set());
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setName("");
            setQuery("");
            setSelected(new Set());
        }
    }, [isOpen]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const memberIds = Array.from(selected);
        await onCreate({ name: name.trim(), memberIds });
        onClose();
    }

    const toggleUser = (id) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelected(next);
    }

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u => (u.fullName || '').toLowerCase().includes(q));
    }, [users, query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <div ref={modalRef} className="bg-base-100 w-full max-w-md rounded-lg shadow-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Create Group</h3>
                    <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Group name</span></label>
                        <input className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project Team" />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Add members</span></label>
                        <input className="input input-bordered w-full mb-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search friends" />
                        <div className="max-h-56 overflow-y-auto border rounded-md">
                            {filteredUsers.map(u => (
                                <label key={u._id} className="flex items-center gap-3 p-2 border-b last:border-b-0 cursor-pointer hover:bg-base-200">
                                    <input type="checkbox" className="checkbox checkbox-sm" checked={selected.has(u._id)} onChange={() => toggleUser(u._id)} />
                                    <img src={u.profilePicture || "avatar-default.svg"} alt={u.fullName} className="size-7 rounded-full object-cover" />
                                    <span className="truncate">{u.fullName}</span>
                                </label>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="p-3 text-sm text-zinc-400">No friends found</div>
                            )}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">Selected: {selected.size}</div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!name.trim() || selected.size === 0}>Create</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateGroupModal


