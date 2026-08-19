import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { api } from './api';
import Preloader from './Preloader';

export default function NewsPostPage({ onBack }) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get slug from URL
    const slug = window.location.pathname.split('/').pop();

    useEffect(() => {
        async function fetchPost() {
            try {
                const data = await api.get(`/posts/${slug}`);
                setPost(data.post);
            } catch (err) {
                console.error("Failed to load post:", err);
                setError(err.message || "Post not found");
            } finally {
                setLoading(false);
            }
        }
        fetchPost();
    }, [slug]);

    if (!loading && error) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center px-6 py-32">
                <h1 className="text-4xl font-black uppercase tracking-widest text-white mb-4">404</h1>
                <p className="text-neutral-500 mb-8">{error}</p>
                <button onClick={onBack} className="px-6 py-3 rounded-full bg-yellow-600 text-black font-bold uppercase tracking-widest text-xs hover:bg-yellow-500 transition-colors cursor-pointer">
                    Back to News
                </button>
            </div>
        );
    }

    return (
        <div className="w-full text-white relative">
            <Preloader isVisible={loading} />
            {post && (
                <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                    <button 
                        onClick={onBack}
                        className="mb-8 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-semibold cursor-pointer group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to News
                    </button>
                    {/* Header */}
                    <header className="mb-12 text-center">
                        <div className="flex items-center justify-center gap-4 text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-6">
                            <span className="flex items-center gap-1.5">
                                <Clock size={12} />
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            {post.author && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-neutral-800" />
                                    <span className="flex items-center gap-1.5 text-yellow-600/80">
                                        <User size={12} />
                                        {post.author.name}
                                    </span>
                                </>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-wide text-white leading-tight mb-6">
                            {post.title}
                        </h1>
                        {post.excerpt && (
                            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                                {post.excerpt}
                            </p>
                        )}
                    </header>

                    {/* Cover Image */}
                    {post.coverImage && (
                        <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-black/50 border border-neutral-800">
                            <img 
                                src={post.coverImage} 
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content - Using whitespace-pre-wrap for basic text formatting. In a real app with markdown, use a markdown renderer. */}
                    <div className="prose prose-invert prose-yellow max-w-3xl mx-auto">
                        <div className="text-neutral-300 leading-relaxed text-base md:text-lg whitespace-pre-wrap font-sans">
                            {post.content}
                        </div>
                    </div>
                </article>
            )}
        </div>
    );
}
