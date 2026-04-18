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
        <div className="library-search-wrapper">
            <SearchIcon className="ml-4 h-4 w-4 text-[var(--text-muted)]" />
            <input
                type="text"
                placeholder="Search by title or author..."
                className="library-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
    )
}

export default Search
