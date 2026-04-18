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
        <main className="min-h-screen text-slate-900 pt-[calc(var(--navbar-height)+2rem)] pb-20">
            <div className="wrapper">
                <HeroSection />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 border-b border-slate-200 pb-8">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-tight mb-1">
                            Collection
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">Access your interactive library</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <Search />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {books.map((book) => (
                        <BookCard key={book._id} title={book.title} author={book.author} persona={book.persona} coverURL={book.coverURL} slug={book.slug}/>
                    ))}
                </div>
            </div>
        </main>
    )
}
export default Page
