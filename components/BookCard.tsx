'use client';

import {BookCardProps} from "@/types";
import Image from "next/image";
import {DEFAULT_COVER_URL} from "@/lib/constants";
import {useUser} from "@clerk/nextjs";
import Link from "next/link";

const BookCard = ({ title, author, coverURL, slug }: BookCardProps) => {
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
            className="cursor-pointer"
        >
            <article className="book-card">
                <figure className="book-card-figure">
                    <div className="book-card-cover-wrapper">
                        <Image src={coverURL || DEFAULT_COVER_URL} alt={title} width={133} height={200} className="book-card-cover" />
                    </div>

                    <figcaption className="book-card-meta">
                        <h3 className="book-card-title">{title}</h3>
                        <p className="book-card-author">{author}</p>
                    </figcaption>
                </figure>
            </article>
        </Link>
    )
}
export default BookCard