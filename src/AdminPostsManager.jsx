import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertTriangle, Trash2, Pencil, Eye, EyeOff, FileText, Image as ImageIcon, X, Upload } from 'lucide-react';
import { api } from './api';

const inputClass =
    'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-neutral-500 ' +
    'bg-neutral-950 border border-neutral-700 ' +
    'focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 focus:outline-none ' +
    'transition-all duration-300';

const labelClass =
    'block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function AdminPostsManager({ showToast }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [isEditing, setIsEditing] = useState(false);
    const [currentPostId, setCurrentPostId] = useState(null);
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    
    // Image state
    const [coverImageFile, setCoverImageFile] = useState(null); // File object for upload
    const [coverImagePreview, setCoverImagePreview] = useState(null); // URL (existing or blob)
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
        setCoverImagePreview(null);
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
        setCoverImagePreview(post.coverImage || null);
    }

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Only image files are supported.', 'error');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            showToast('Image size must be less than 5MB.', 'error');
            return;
        }

        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
    }

    function handleRemoveImage() {
        setCoverImageFile(null);
        setCoverImagePreview(null);
        const fileInput = document.getElementById('cover-image-upload');
        if (fileInput) fileInput.value = '';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('excerpt', excerpt);
            formData.append('content', content);
            
            // Only append the file if it's a new upload
            if (coverImageFile) {
                formData.append('coverImage', coverImageFile);
            }
            // If editing and image was removed, backend needs to know to remove it.
            // A simple convention: if no file, but we explicitly want to clear it, 
            // we could send a specific flag. For now, if preview is null, we can send clearImage flag.
            if (isEditing && !coverImagePreview && !coverImageFile) {
                formData.append('clearCoverImage', 'true');
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
        <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-8">
            {/* ── Left column: Form ──────────────────────────────── */}
            <div className="space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-yellow-600/15 border border-yellow-600/30 flex items-center justify-center">
                            {isEditing ? <Pencil size={20} className="text-yellow-500" /> : <Plus size={20} className="text-yellow-500" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">
                                {isEditing ? 'Edit Post' : 'News & Posts'}
                            </h2>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">
                                {isEditing ? 'Update existing content' : '+ Create New Post'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className={labelClass}>Post Title</label>
                            <input
                                type="text"
                                placeholder="Enter post title..."
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
                                placeholder="Full markdown or text content here..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={8}
                                className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Cover Image</label>
                            
                            {!coverImagePreview ? (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-700 rounded-xl hover:border-yellow-600/50 hover:bg-neutral-950 transition-colors cursor-pointer group">
                                    <Upload size={24} className="text-neutral-500 group-hover:text-yellow-500 mb-2 transition-colors" />
                                    <span className="text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">Upload cover image</span>
                                    <span className="text-[10px] text-neutral-600 mt-1 uppercase tracking-widest">Max 5MB (16:9 recommended)</span>
                                    <input 
                                        id="cover-image-upload"
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageChange}
                                    />
                                </label>
                            ) : (
                                <div className="relative w-full rounded-xl overflow-hidden border border-neutral-700 group bg-neutral-950">
                                    {/* 16:9 Aspect Ratio Container for Preview */}
                                    <div className="relative w-full pb-[56.25%]">
                                        <img 
                                            src={coverImagePreview} 
                                            alt="Cover Preview" 
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                            <label className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer transition-colors">
                                                Replace
                                                <input 
                                                    id="cover-image-upload"
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                            <button 
                                                type="button" 
                                                onClick={handleRemoveImage}
                                                className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                                           bg-gradient-to-r from-yellow-700 to-yellow-600 text-black shadow-lg shadow-yellow-600/20
                                           hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? 'Update Post' : 'Create Post')}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
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
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                        Published Posts
                    </h2>
                    <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                        {posts.length} Total
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-16 text-neutral-600 bg-neutral-900/30 rounded-2xl border border-neutral-800/50">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-medium tracking-wide">Loading posts...</span>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-2xl">
                        <FileText size={32} className="text-neutral-700 mx-auto mb-4" />
                        <p className="text-sm text-neutral-400 font-semibold">No posts published yet.</p>
                        <p className="text-xs text-neutral-600 mt-2">Create your first post using the form.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className={`group bg-neutral-900 border ${post.isVisible ? 'border-neutral-800 hover:border-neutral-700' : 'border-neutral-800/50 opacity-60 hover:opacity-80'} rounded-2xl p-4 flex gap-5 transition-all`}>
                                {/* 16:9 Thumbnail in List */}
                                <div className="w-32 sm:w-40 h-20 sm:h-[90px] shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 relative">
                                    {post.coverImage ? (
                                        <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ImageIcon size={24} className="text-neutral-800" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="font-bold text-white truncate text-base lg:text-lg" title={post.title}>{post.title}</h3>
                                            <div className="flex gap-1.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={`/news/${post.slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
                                                    title="Preview Post"
                                                >
                                                    <Eye size={14} />
                                                </a>
                                                <button
                                                    onClick={() => handleToggleVisibility(post.id)}
                                                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
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
                                                    className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-yellow-500 hover:border-yellow-600/50 transition-colors cursor-pointer"
                                                    title="Edit Post"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-neutral-500 mt-1 sm:mt-2 line-clamp-2">
                                            {post.excerpt || post.content}
                                        </p>
                                    </div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-600 mt-3 flex items-center gap-2">
                                        <span>{post.author?.name || 'Admin'}</span>
                                        <span>•</span>
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
