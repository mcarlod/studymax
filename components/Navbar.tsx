'use client';

import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {cn} from "@/lib/utils";


const navItems = [
    { label: "Library", href: "/" },
    { label: "Add New", href: "/books/new" },
    { label: "Pricing", href: "/subscriptions" },
]

const Navbar = () => {
    const pathName = usePathname();
    const { isSignedIn, isLoaded, user } = useUser();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const showAuth = mounted && isLoaded;

    return (
        <header className="w-full fixed z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
            <div className="wrapper navbar-height py-4 flex justify-between items-center">
                <Link href="/" className="flex gap-0.5 items-center group">
                    <span className="logo-text tracking-tighter font-serif text-2xl bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent group-hover:from-indigo-500 group-hover:to-blue-400 transition-all">STUDYMAX</span>
                </Link>

                <nav className="w-fit flex gap-8 items-center">
                    {navItems.map(({ label, href }) => {
                        const isActive = pathName === href || (href !== '/' && pathName.startsWith(href));

                        return (
                            <Link href={href} key={label} className={cn('text-sm font-semibold transition-colors hover:text-indigo-600', isActive ? 'text-indigo-600' : 'text-slate-500')}>
                                {label}
                            </Link>
                        )
                    })}

                    <div className="flex gap-4 items-center min-w-[100px] justify-end">
                        {!showAuth ? (
                            <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-lg" />
                        ) : !isSignedIn ? (
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.2)]">Sign In</button>
                            </SignInButton>
                        ) : (
                            <div className="flex items-center gap-3">
                                <UserButton />
                                {showAuth && user?.firstName && (
                                    <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors hidden sm:block">
                                        {user.firstName}
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    )
}

export default Navbar
