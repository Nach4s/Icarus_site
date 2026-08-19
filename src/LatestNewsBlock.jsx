import React, { useState, useEffect } from 'react';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import { api } from './api';

export default function LatestNewsBlock({ onPostClick }) {
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
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Loading feed...</span>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="relative max-w-6xl mx-auto border border-dashed border-neutral-800 bg-neutral-900/20 rounded-2xl h-64 lg:h-80 flex flex-col items-center justify-center text-center px-4">
                <FileText size={32} className="text-neutral-700 mb-4" />
                <p className="text-sm font-semibold text-neutral-500">No news yet.</p>
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-2">Check back later for updates</p>
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
            className="group relative max-w-6xl mx-auto block rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 hover:border-yellow-600/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(202,138,4,0.15)]"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-transparent z-10" />
            
            {post.coverImage && (
                <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-700 group-hover:scale-105" 
                />
            )}
            
            <div className="relative z-20 p-8 md:p-12 lg:p-16 h-full flex flex-col justify-end min-h-[360px] lg:min-h-[440px]">
                <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-yellow-600/10 text-yellow-500 border border-yellow-600/20 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        Latest News
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1.5 bg-neutral-950/50 px-3 py-1 rounded-full backdrop-blur-sm">
                        <Clock size={12} />
                        {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                </div>
                
                <h3 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-wide text-white mb-4 leading-tight group-hover:text-yellow-500 transition-colors duration-300 max-w-4xl">
                    {post.title}
                </h3>
                
                {post.excerpt && (
                    <p className="text-neutral-400 text-sm md:text-base lg:text-lg max-w-3xl leading-relaxed mb-8 line-clamp-2">
                        {post.excerpt}
                    </p>
                )}
                
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-600 group-hover:text-yellow-500 transition-colors">
                    Read Full Article
                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                </div>
            </div>
        </a>
    );
}
