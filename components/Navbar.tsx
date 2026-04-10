'use client';

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

    return (
        <header className="w-full fixed z-50 bg-(--bg-primary)">
            <div className="wrapper navbar-height py-4 flex justify-between items-center">
                <Link href="/" className="flex gap-0.5 items-center">
                    <span className="logo-text">StudyMax</span>
                </Link>

                <nav className="w-fit flex gap-7.5 items-center">
                    {navItems.map(({ label, href }) => {
                        const isActive = pathName === href || (href !== '/' && pathName.startsWith(href + '/'));

                        return (
                            <Link href={href} key={label} className={cn('nav-link-base', isActive ? 'nav-link-active' : 'text-black hover:opacity-70')}>
                                {label}
                            </Link>
                        )
                    })}

                    <div className="flex gap-4 items-center">
                        {!isLoaded ? (
                            <div className="w-20 h-8 bg-gray-200 animate-pulse rounded-lg" />
                        ) : !isSignedIn ? (
                            <SignInButton mode="modal">
                                <button className="nav-btn">Sign In</button>
                            </SignInButton>
                        ) : (
                            <div className="nav-user-link">
                                <UserButton />
                                {user?.firstName && (
                                    <Link href="/" className="nav-user-name">
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
