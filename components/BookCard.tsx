'use client';

import {BookCardProps} from "@/types";
import Image from "next/image";
import {DEFAULT_COVER_URL} from "@/lib/constants";
import {useUser} from "@clerk/nextjs";
import Link from "next/link";

const BookCard = ({ title, author, persona, coverURL, slug }: BookCardProps) => {
    const { isSignedIn } = useUser();

    const handleLinkClick = (e: React.MouseEvent) => {
        if (!isSignedIn) {
            e.preventDefault();
            alert("Please sign in to view this book.");
        }
    };

    return (
        <Link 
            href={`/books/${slug}`}
            onClick={handleLinkClick}
            className="group cursor-pointer block"
        >
            <article 
                className="relative border border-slate-200 rounded-2xl p-4 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
                style={{ background: 'var(--bg-card-gradient)' }}
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full transition-all group-hover:bg-indigo-500/10" />
                
                <figure className="relative z-10">
                    <div className="aspect-[2/3] w-full relative mb-4 rounded-xl overflow-hidden shadow-lg">
                        <Image 
                            src={coverURL || DEFAULT_COVER_URL} 
                            alt={title} 
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                    </div>

                    <figcaption>
                        <h3 className="text-slate-900 font-bold text-lg mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{title}</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 text-sm font-semibold">{author}</p>
                            {persona && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <p className="text-indigo-500 text-xs font-bold uppercase tracking-wider">voiced by {persona}</p>
                                </>
                            )}
                        </div>
                    </figcaption>
                </figure>
            </article>
        </Link>
    )
}
export default BookCard