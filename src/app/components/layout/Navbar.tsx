"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiClock, FiBarChart2, FiSettings, FiMenu, FiX, FiSun, FiMoon } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";

const mainNavItems = [
  { name: "Dashboard", path: "/", icon: <FiHome className="w-5 h-5" /> },
  { name: "Timer", path: "/timer", icon: <FiClock className="w-5 h-5" /> },
  { name: "Stats", path: "/stats", icon: <FiBarChart2 className="w-5 h-5" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Add scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Keep the dark navbar style for both themes
  const navBgClass = scrolled ? 'bg-black/60' : 'bg-black/30';
  
  // Always use light text on dark navbar
  const textClass = 'text-white';
  const textMutedClass = 'text-white/80';
  const pillBgClass = 'bg-black/20';
  const buttonBgClass = 'bg-black/20';
  const activeBgClass = 'bg-primary-500/30';
  const hoverBgClass = 'hover:bg-black/30';

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${navBgClass} backdrop-blur-md shadow-md`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex justify-between h-14 sm:h-16 relative">
          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center z-10">
            <button
              onClick={toggleMobileMenu}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/20"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <FiX className="w-5 h-5 text-white" />
              ) : (
                <FiMenu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Logo - hidden on mobile when menu is open, perfectly centered when closed */}
          <div className={`absolute left-0 right-0 mx-auto flex items-center justify-center h-full ${isMobileMenuOpen ? 'hidden sm:flex sm:static sm:justify-start' : 'sm:static sm:justify-start sm:mx-0 sm:left-auto sm:right-auto'}`}>
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-white font-display font-bold text-xl sm:text-2xl">Focus</span>
            </Link>
          </div>

          {/* Mobile Navigation - Shown in top bar when menu is open */}
          {isMobileMenuOpen && (
            <div className="sm:hidden flex-1 flex justify-around items-center">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={toggleMobileMenu}
                    className={`flex items-center justify-center p-2 rounded-full ${
                      isActive 
                        ? 'bg-primary-500/30 text-white' 
                        : 'text-white/80'
                    }`}
                    aria-label={item.name}
                  >
                    {item.icon}
                  </Link>
                );
              })}
              
              {/* Settings & Theme Icons for Mobile */}
              <Link
                href="/settings"
                onClick={toggleMobileMenu}
                className={`flex items-center justify-center p-2 rounded-full ${
                  pathname === '/settings' || pathname.startsWith('/settings/') 
                    ? 'bg-primary-500/30 text-white' 
                    : 'text-white/80'
                }`}
                aria-label="Settings"
              >
                <FiSettings className="w-5 h-5" />
              </Link>
              
              <button
                onClick={() => {toggleTheme(); toggleMobileMenu();}}
                className="flex items-center justify-center p-2 rounded-full text-white/80"
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDark ? (
                  <FiSun className="w-5 h-5 text-white" />
                ) : (
                  <FiMoon className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          )}

          {/* Centered Navigation Pill - Desktop only */}
          <div className="hidden sm:flex bg-black/20 p-1.5 rounded-full items-center gap-2 shadow-lg backdrop-blur-md">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-label={item.name}
                  className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary-500/30 text-white scale-110' 
                      : 'text-white/90 hover:bg-black/30 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right-side controls - Desktop only */}
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black/20 text-primary-400 hover:bg-primary-500/20"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? (
                <FiSun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <FiMoon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            
            <Link
              href="/settings"
              aria-label="Settings"
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                pathname === '/settings' || pathname.startsWith('/settings/') 
                  ? 'bg-primary-500/30 text-white scale-110' 
                  : 'bg-black/20 text-white/90 hover:bg-primary-500/20'
              }`}
            >
              <FiSettings className="w-5 h-5" />
              {(pathname === '/settings' || pathname.startsWith('/settings/')) && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 