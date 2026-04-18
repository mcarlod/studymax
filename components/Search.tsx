'use client';

import React, {useEffect, useState} from 'react'
import {useRouter, useSearchParams} from "next/navigation";
import {Search as SearchIcon} from "lucide-react";

const Search = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('query') || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query) {
                router.push(`?query=${encodeURIComponent(query)}`);
            } else {
                router.push('/');
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, router]);

    return (
        <div className="relative group w-full md:w-80">
            <div className="absolute inset-0 bg-indigo-600/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-all shadow-sm">
                <SearchIcon className="ml-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                    type="text"
                    placeholder="Search materials..."
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
        </div>
    )
}

export default Search
