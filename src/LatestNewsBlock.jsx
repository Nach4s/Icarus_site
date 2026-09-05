import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import { api } from './api';
import { useLang } from './LanguageContext.jsx';

export default function LatestNewsBlock({ onPostClick }) {
    const { t } = useLang();
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

    if (loading) {
        return (
            <div className="relative max-w-6xl mx-auto border border-neutral-800 bg-neutral-900/50 rounded-2xl h-64 lg:h-80 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center opacity-50">
                    <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">{t('news.loadingFeed')}</span>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="relative max-w-6xl mx-auto border border-dashed border-neutral-800 bg-neutral-900/20 rounded-2xl h-64 lg:h-80 flex flex-col items-center justify-center text-center px-4">
                <FileText size={32} className="text-neutral-700 mb-4" />
                <p className="text-sm font-semibold text-neutral-500">{t('news.noNewsYet')}</p>
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-2">{t('news.checkLater')}</p>
            </div>
        );
    }

    return (
        <a 
            href={`/news/${post.slug}`}
            onClick={(e) => {
                if (onPostClick) {
                    e.preventDefault();
                    onPostClick(post.slug);
                }
            }}
            className="group relative max-w-6xl mx-auto block rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/50 hover:border-yellow-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(202,138,4,0.2)]"
        >
            {post.coverFormat === 'portrait' ? (
                <div className="flex flex-col md:flex-row min-h-[360px] lg:min-h-[440px]">
                    <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-20">
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wide text-white mb-4 leading-tight group-hover:text-yellow-500 transition-colors duration-300">
                            {post.title}
                        </h3>
                        {post.excerpt && (
                            <p className="text-neutral-300 text-sm md:text-base lg:text-lg leading-relaxed mb-8 line-clamp-3">
                                {post.excerpt}
                            </p>
                        )}
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-600 group-hover:text-yellow-500 transition-colors">
                            {t('news.readFullArticle')}
                            <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                    </div>
                    {post.coverImage && (
                        <div className="w-full md:w-[320px] lg:w-[400px] h-[300px] md:h-auto shrink-0 relative overflow-hidden bg-neutral-950">
                            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-neutral-900 to-transparent z-10 hidden md:block" />
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neutral-900 to-transparent z-10 md:hidden" />
                            <img 
                                src={post.coverImage} 
                                alt={post.title} 
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-[1.03]" 
                            />
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.58) 42%, rgba(0, 0, 0, 0.12) 100%)' }} />
                    
                    {post.coverImage && (
                        <img 
                            src={post.coverImage} 
                            alt={post.title} 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-[1.03]" 
                        />
                    )}
                    
                    <div className="relative z-20 p-8 md:p-12 lg:p-16 h-full flex flex-col justify-end min-h-[360px] lg:min-h-[440px]">
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wide text-white mb-4 leading-tight group-hover:text-yellow-500 transition-colors duration-300 max-w-2xl">
                            {post.title}
                        </h3>
                        
                        {post.excerpt && (
                            <p className="text-neutral-300 text-sm md:text-base lg:text-lg max-w-2xl leading-relaxed mb-8 line-clamp-2">
                                {post.excerpt}
                            </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-600 group-hover:text-yellow-500 transition-colors">
                            {t('news.readFullArticle')}
                            <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                    </div>
                </>
            )}
        </a>
    );
}
