import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertTriangle, Trash2, Pencil, Eye, EyeOff, FileText, Image as ImageIcon, X } from 'lucide-react';
import { api } from './api';

const inputClass =
    'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-500 ' +
    'bg-neutral-950 border border-neutral-700 ' +
    'focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none ' +
    'transition-all duration-300';

const labelClass =
    'block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2';

export default function AdminPostsManager({ showToast }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    async function loadPosts() {
        try {
            setLoading(true);
            const data = await api.get('/admin/posts');
            setPosts(data.posts || []);
        } catch (err) {
            showToast(err.message || 'Failed to load posts.', 'error');
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setIsEditing(false);
        setCurrentPostId(null);
        setTitle('');
        setExcerpt('');
        setContent('');
        setCoverImageFile(null);
        const fileInput = document.getElementById('cover-image-upload');
        if (fileInput) fileInput.value = '';
    }

    function handleEditClick(post) {
        setIsEditing(true);
        setCurrentPostId(post.id);
        setTitle(post.title);
        setExcerpt(post.excerpt || '');
        setContent(post.content);
        setCoverImageFile(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('excerpt', excerpt);
            formData.append('content', content);
            if (coverImageFile) {
                formData.append('coverImage', coverImageFile);
            }

            if (isEditing) {
                const data = await api.patch(`/admin/posts/${currentPostId}`, formData);
                setPosts(prev => prev.map(p => p.id === currentPostId ? data.post : p));
                showToast('Post updated successfully.', 'success');
            } else {
                const data = await api.post('/admin/posts', formData);
                setPosts(prev => [data.post, ...prev]);
                showToast('Post created successfully.', 'success');
            }
            resetForm();
        } catch (err) {
            showToast(err.message || 'Failed to save post.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleToggleVisibility(id) {
        try {
            const data = await api.patch(`/admin/posts/${id}/visibility`);
            setPosts(prev => prev.map(p => p.id === id ? data.post : p));
            showToast(`Post is now ${data.post.isVisible ? 'Visible' : 'Hidden'}.`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to toggle visibility.', 'error');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
        try {
            await api.delete(`/admin/posts/${id}`);
            setPosts(prev => prev.filter(p => p.id !== id));
            if (currentPostId === id) resetForm();
            showToast('Post deleted successfully.', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to delete post.', 'error');
        }
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">
            {/* ── Left column: Form ──────────────────────────────── */}
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-yellow-600/15 border border-yellow-600/30 flex items-center justify-center">
                            {isEditing ? <Pencil size={18} className="text-yellow-500" /> : <Plus size={18} className="text-yellow-500" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">
                                {isEditing ? 'Edit Post' : 'New Post'}
                            </h2>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                                {isEditing ? 'Update existing content' : 'Publish news & updates'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClass}>Post Title</label>
                            <input
                                type="text"
                                placeholder="e.g. New Feature Release"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Short Description (Excerpt)</label>
                            <textarea
                                placeholder="A brief summary for the news card..."
                                value={excerpt}
                                onChange={e => setExcerpt(e.target.value)}
                                rows={2}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Post Content</label>
                            <textarea
                                placeholder="Full text content here..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={6}
                                className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Cover Image</label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                                                  bg-neutral-950 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500
                                                  cursor-pointer transition-colors">
                                    <ImageIcon size={16} />
                                    <span>{coverImageFile ? coverImageFile.name : 'Choose file...'}</span>
                                    <input 
                                        id="cover-image-upload"
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={e => setCoverImageFile(e.target.files[0])}
                                    />
                                </label>
                                {coverImageFile && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setCoverImageFile(null); document.getElementById('cover-image-upload').value = ''; }}
                                        className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors cursor-pointer"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-yellow-600 hover:bg-yellow-500 text-neutral-950 shadow-lg shadow-yellow-600/20
                                           transition disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? 'Update Post' : 'Create Post')}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest
                                               bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700
                                               transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Right column: List ──────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                        Published Posts
                    </h2>
                    <span className="text-[10px] text-neutral-600">
                        {posts.length} total
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-12 text-neutral-600">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Loading…</span>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl">
                        <FileText size={28} className="text-neutral-700 mx-auto mb-3" />
                        <p className="text-sm text-neutral-500">No posts yet.</p>
                        <p className="text-xs text-neutral-600 mt-1">Publish your first news update.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {posts.map(post => (
                            <div key={post.id} className={`bg-neutral-900 border ${post.isVisible ? 'border-neutral-800' : 'border-neutral-800/50 opacity-60'} rounded-2xl p-4 flex gap-4 transition-all`}>
                                {post.coverImage ? (
                                    <img src={post.coverImage} alt={post.title} className="w-24 h-24 object-cover rounded-xl shrink-0" />
                                ) : (
                                    <div className="w-24 h-24 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                                        <FileText size={24} className="text-neutral-700" />
                                    </div>
                                )}
                                
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-white truncate text-base">{post.title}</h3>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleToggleVisibility(post.id)}
                                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                                        post.isVisible 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                                                        : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:bg-neutral-700 hover:text-white'
                                                    }`}
                                                    title={post.isVisible ? 'Visible (Click to hide)' : 'Hidden (Click to show)'}
                                                >
                                                    {post.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(post)}
                                                    className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
                                                    title="Edit Post"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                            {post.excerpt || post.content}
                                        </p>
                                    </div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-600 mt-3 flex items-center gap-2">
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className={post.isVisible ? 'text-emerald-500/80' : 'text-neutral-500'}>
                                            {post.isVisible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
