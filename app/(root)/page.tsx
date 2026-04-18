import React from 'react'
import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import {getAllBooks} from "@/lib/actions/book.actions";
import Search from "@/components/Search";

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Page = async ({ searchParams }: Props) => {
    const { query } = await searchParams;
    const bookResults = await getAllBooks(query as string)
    const books = bookResults.success ? bookResults.data ?? [] : []

    return (
        <main className={"wrapper container"}>
            <HeroSection />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
                    Recent Books
                </h2>
                <Search />
            </div>

            <div className={"library-books-grid"}>
                {books.map((book) => (
                    <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug}/>
                ))}
            </div>
        </main>
    )
}
export default Page
