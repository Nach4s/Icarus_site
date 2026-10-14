import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import { api } from './api';
import Preloader from './Preloader';
import { useLang } from './LanguageContext.jsx';
import { formatPostDate } from './formatDate.js';
import PageHeading from './PageHeading.jsx';

export default function NewsPage({ onPostClick }) {
    const { t, lang } = useLang();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const data = await api.get('/posts');
                setPosts(data.posts || []);
            } catch (err) {
                console.error("Failed to load posts:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    return (
        <div className="w-full text-white relative">

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
                <PageHeading eyebrow={t('news.platformUpdates')} title={t('news.latestNews')} />

                {!loading && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
                        <FileText size={48} className="text-neutral-600 mb-6" aria-hidden="true" />
                        <h2 className="text-xl font-bold text-white mb-2">{t('news.noNews')}</h2>
                        <p className="text-neutral-400 text-sm">{t('news.checkBack')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <a
                                key={post.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (onPostClick) onPostClick(post.slug);
                                }}
                                href={`/news/${post.slug}`}
                                className="group flex flex-col glass-panel rounded-3xl overflow-hidden cursor-pointer
                                           transition-[border-color,box-shadow,transform] duration-300
                                           hover:-translate-y-1 hover:border-yellow-500/40 hover:shadow-[0_24px_60px_-28px_rgba(234,179,8,0.45)]"
                            >
                                {/* Uniform cover height keeps the grid even; portrait covers crop towards the top */}
                                <div className="relative w-full aspect-[16/10] bg-black overflow-hidden shrink-0">
                                    {post.coverImage ? (
                                        <img
                                            src={post.coverImage}
                                            alt=""
                                            loading="lazy"
                                            className={`w-full h-full object-cover opacity-85 transition-[opacity,transform] duration-500 group-hover:opacity-100 group-hover:scale-105 ${post.coverFormat === 'portrait' ? 'object-[center_20%]' : ''}`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText size={32} className="text-neutral-700" aria-hidden="true" />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c0d12] to-transparent" aria-hidden="true" />
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-3">
                                        <Clock size={12} aria-hidden="true" />
                                        {formatPostDate(post.createdAt, lang)}
                                    </div>
                                    <h2 className="font-display text-lg font-bold uppercase leading-snug text-white mb-3 line-clamp-2 transition-colors duration-300 group-hover:text-yellow-300">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3 mb-6 flex-1">
                                        {post.excerpt || t('news.clickToRead')}
                                    </p>
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-2">
                                        {t('news.readArticle')}
                                        <ArrowRight size={13} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
