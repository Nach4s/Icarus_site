import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, FileText } from 'lucide-react';
import { api } from './api';
import Preloader from './Preloader';

export default function NewsPage() {
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
        <div className="min-h-screen bg-neutral-950 text-white relative">
            <Preloader isVisible={loading} />

            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/60">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a 
                        href="/"
                        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-semibold cursor-pointer group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Home
                    </a>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                <div className="mb-12">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-600 mb-2">Platform Updates</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-white">Latest News</h1>
                </div>

                {!loading && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-800 bg-neutral-900/20 rounded-2xl">
                        <FileText size={48} className="text-neutral-700 mb-6" />
                        <h2 className="text-xl font-bold text-white mb-2">No news yet</h2>
                        <p className="text-neutral-500 text-sm">Check back later for platform updates and announcements.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <a 
                                key={post.id}
                                href={`/news/${post.slug}`}
                                className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-yellow-600/50 hover:shadow-[0_0_30px_rgba(202,138,4,0.1)] transition-all duration-300"
                            >
                                <div className="relative h-48 w-full bg-neutral-950 overflow-hidden shrink-0">
                                    {post.coverImage ? (
                                        <img 
                                            src={post.coverImage} 
                                            alt={post.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText size={32} className="text-neutral-800" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-3">
                                        <Clock size={12} />
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-500 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-neutral-400 line-clamp-3 mb-6 flex-1">
                                        {post.excerpt || "Click to read more about this update."}
                                    </p>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 flex items-center gap-2">
                                        Read Article
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
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
