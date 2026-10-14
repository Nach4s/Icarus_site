import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import { api } from './api';
import { useLang } from './LanguageContext.jsx';
import { formatPostDate } from './formatDate.js';

// "Read full article" pill shared by both layouts
function ReadMore({ label }) {
    return (
        <span className="inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest
                         bg-yellow-500/10 border border-yellow-500/30 text-yellow-400
                         transition-[background-color,border-color,color] duration-300
                         group-hover:bg-yellow-500 group-hover:border-yellow-500 group-hover:text-black">
            {label}
            <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
    );
}

export default function LatestNewsBlock({ onPostClick }) {
    const { t, lang } = useLang();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLatest() {
            try {
                const data = await api.get('/posts/latest');
                setPost(data.post);
            } catch (err) {
                console.error("Failed to load latest post:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLatest();
    }, []);

    const heading = (
        <div className="max-w-6xl mx-auto flex items-center gap-4 mb-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">{t('news.latestNews')}</span>
            <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" aria-hidden="true" />
        </div>
    );

    if (loading) {
        return (
            <section aria-busy="true">
                {heading}
                <div className="max-w-6xl mx-auto glass-panel rounded-3xl h-64 lg:h-80 flex items-center justify-center">
                    <div className="flex flex-col items-center opacity-60">
                        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">{t('news.loadingFeed')}</span>
                    </div>
                </div>
            </section>
        );
    }

    if (!post) {
        return (
            <section>
                {heading}
                <div className="max-w-6xl mx-auto rounded-3xl border border-dashed border-white/10 bg-white/[0.02] h-64 lg:h-80 flex flex-col items-center justify-center text-center px-4">
                    <FileText size={32} className="text-neutral-600 mb-4" aria-hidden="true" />
                    <p className="text-sm font-semibold text-neutral-400">{t('news.noNewsYet')}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-2">{t('news.checkLater')}</p>
                </div>
            </section>
        );
    }

    const date = (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-5">
            <Clock size={12} aria-hidden="true" />
            {formatPostDate(post.createdAt, lang)}
        </span>
    );

    return (
        <section>
            {heading}
            <a
                href={`/news/${post.slug}`}
                onClick={(e) => {
                    if (onPostClick) {
                        e.preventDefault();
                        onPostClick(post.slug);
                    }
                }}
                className="group relative max-w-6xl mx-auto block rounded-3xl overflow-hidden glass-panel
                           transition-[border-color,box-shadow,transform] duration-500
                           hover:-translate-y-1 hover:border-yellow-500/40 hover:shadow-[0_30px_80px_-30px_rgba(234,179,8,0.35)]"
            >
                {post.coverFormat === 'portrait' ? (
                    <div className="flex flex-col-reverse md:flex-row min-h-[360px] lg:min-h-[460px]">
                        <div className="flex-1 min-w-0 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-20">
                            {date}
                            <h3 className="font-display text-2xl md:text-4xl lg:text-[2.75rem] font-extrabold uppercase text-white mb-5 leading-[1.1] [text-wrap:balance] transition-colors duration-300 group-hover:text-yellow-300">
                                {post.title}
                            </h3>
                            {post.excerpt && (
                                <p className="text-neutral-300 text-sm md:text-base lg:text-lg leading-relaxed mb-9 line-clamp-3 [text-wrap:pretty]">
                                    {post.excerpt}
                                </p>
                            )}
                            <ReadMore label={t('news.readFullArticle')} />
                        </div>
                        {post.coverImage && (
                            <div className="w-full md:w-[320px] lg:w-[400px] h-[300px] md:h-auto shrink-0 relative overflow-hidden bg-black">
                                {/* Fade the cover into the text side */}
                                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0c0d12] to-transparent z-10 hidden md:block" aria-hidden="true" />
                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0c0d12] to-transparent z-10 md:hidden" aria-hidden="true" />
                                <img
                                    src={post.coverImage}
                                    alt=""
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover opacity-90 transition-[opacity,transform] duration-700 group-hover:opacity-100 group-hover:scale-[1.04]"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {post.coverImage && (
                            <img
                                src={post.coverImage}
                                alt=""
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover opacity-70 transition-[opacity,transform] duration-700 group-hover:opacity-90 group-hover:scale-[1.04]"
                            />
                        )}
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-black/10" aria-hidden="true" />

                        <div className="relative z-20 p-8 md:p-12 lg:p-16 h-full flex flex-col justify-end min-h-[360px] lg:min-h-[460px]">
                            {date}
                            <h3 className="font-display text-2xl md:text-4xl lg:text-5xl font-extrabold uppercase text-white mb-5 leading-[1.1] max-w-3xl [text-wrap:balance] transition-colors duration-300 group-hover:text-yellow-300">
                                {post.title}
                            </h3>
                            {post.excerpt && (
                                <p className="text-neutral-200 text-sm md:text-base lg:text-lg max-w-2xl leading-relaxed mb-9 line-clamp-2 [text-wrap:pretty]">
                                    {post.excerpt}
                                </p>
                            )}
                            <ReadMore label={t('news.readFullArticle')} />
                        </div>
                    </>
                )}
            </a>
        </section>
    );
}
