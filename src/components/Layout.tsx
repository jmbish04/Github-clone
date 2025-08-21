import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Menu, GitMerge, Search, Home, Book, GitPullRequest, AlertCircle, Star, Settings, LogOut } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useQuery } from '@tanstack/react-query';
import { listRepos } from '@/utils/api';
import { NotificationBell } from './NotificationBell';
const navLinks = [
  { name: 'Explore', href: '/', icon: Home },
  { name: 'Your Repos', href: '/users/cloudflare', icon: Book },
  { name: 'Stars', href: '#', icon: Star },
  { name: 'Issues', href: '#', icon: AlertCircle },
  { name: 'Pull Requests', href: '#', icon: GitPullRequest },
];
const Header = ({ onMenuClick }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useHotkeys('mod+k', () => setOpen((open) => !open), { preventDefault: true });
  const { data: repos } = useQuery({ queryKey: ['repos'], queryFn: listRepos });
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
        </Button>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <GitMerge className="h-6 w-6 text-primary" />
          <span className="font-display text-xl">Forge</span>
        </Link>
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-md">
            <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => setOpen(true)}>
              <Search className="w-4 h-4 mr-2" />
              Search...
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="https://avatars.githubusercontent.com/u/316555?s=200&v=4" />
                <AvatarFallback>CF</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/users/cloudflare')}>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Repositories">
            {repos?.slice(0, 5).map(repo => (
              <CommandItem
                key={repo.id}
                onSelect={() => {
                  navigate(`/${repo.owner}/${repo.name}`);
                  setOpen(false);
                }}
              >
                {repo.owner}/{repo.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => { navigate('/'); setOpen(false); }}>Explore</CommandItem>
            <CommandItem onSelect={() => { navigate('/users/cloudflare'); setOpen(false); }}>Profile</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
const Sidebar = () => (
  <aside className="hidden md:block w-64 border-r bg-muted/40 p-4">
    <nav className="flex flex-col gap-2">
      {navLinks.map(link => (
        <Link key={link.name} to={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
          <link.icon className="h-4 w-4" />
          {link.name}
        </Link>
      ))}
    </nav>
  </aside>
);
export const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-4">
          <nav className="grid gap-2 text-lg font-medium">
            {navLinks.map(link => (
              <Link key={link.name} to={link.href} className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                <link.icon className="h-5 w-5" />
                {link.name}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};