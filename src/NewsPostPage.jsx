import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { api } from './api';
import Preloader from './Preloader';
import PostContent from './PostContent.jsx';
import { useLang } from './LanguageContext.jsx';

export default function NewsPostPage({ onBack }) {
    const { t } = useLang();
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
                    {t('post.backToNews')}
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center text-neutral-500">
                <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mb-4" />
                <span className="text-[10px] uppercase tracking-widest font-bold">{t('post.loading')}</span>
            </div>
        );
    }

    // 9:16 covers sit beside the text on desktop instead of a tall image above it
    const isPortrait = !!(post && post.coverImage && post.coverFormat === 'portrait');

    const header = post && (
        <header className={isPortrait ? 'mb-10 text-center lg:text-left' : 'mb-12 text-center'}>
            <div className={`flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-3 ${isPortrait ? 'justify-center lg:justify-start' : 'justify-center'}`}>
                <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(post.createdAt).toLocaleDateString()}
                </span>
                {/* Author logic removed as per user request */}
            </div>
            <h1 className={`font-black uppercase tracking-wide text-white leading-tight mb-6 ${isPortrait ? 'text-3xl md:text-4xl' : 'text-3xl md:text-4xl lg:text-5xl'}`}>
                {post.title}
            </h1>
            {post.excerpt && (
                <p className={`text-lg md:text-xl text-neutral-400 leading-relaxed ${isPortrait ? 'max-w-2xl mx-auto lg:mx-0' : 'max-w-2xl mx-auto'}`}>
                    {post.excerpt}
                </p>
            )}
        </header>
    );

    const content = post && (
        // Content: Markdown rendered as styled elements (see PostContent.jsx)
        <div className="relative rounded-3xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm px-5 py-8 sm:px-10 md:py-12">
            <span className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent" />
            <PostContent content={post.content} />
        </div>
    );

    return (
        <div className="w-full text-white relative">
            {post && (
                <article className={`mx-auto px-4 sm:px-6 py-12 md:py-20 ${isPortrait ? 'max-w-6xl' : 'max-w-4xl'}`}>
                    <button
                        onClick={onBack}
                        className="mb-8 flex items-center gap-2 text-neutral-400 hover:text-yellow-500 transition-colors text-sm font-bold cursor-pointer group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        {t('post.backToNews')}
                    </button>

                    {isPortrait ? (
                        // Desktop: cover on the left (stays in view while reading), text on the right.
                        // Phones: header, cover, then text in one column.
                        <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] lg:gap-12 lg:items-start">
                            <div className="lg:hidden">{header}</div>
                            <div className="lg:sticky lg:top-28 w-full max-w-sm mx-auto lg:max-w-none mb-12 lg:mb-0 aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-neutral-800">
                                <img
                                    src={post.coverImage}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <div className="hidden lg:block">{header}</div>
                                {content}
                            </div>
                        </div>
                    ) : (
                        <>
                            {header}
                            {post.coverImage && (
                                <div className="w-full rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-black/50 border border-neutral-800 h-[320px] md:h-[460px]">
                                    <img
                                        src={post.coverImage}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            {content}
                        </>
                    )}
                </article>
            )}
        </div>
    );
}
