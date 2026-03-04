import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SocialFlowLogo } from "@/components/landing/logo";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <SocialFlowLogo className="h-8 w-8" />
          <span>SocialFlow</span>
        </Link>

        <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">
            Products
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Channels
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Resources
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Log in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Start Free Trial</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
