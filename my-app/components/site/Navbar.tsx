"use client";

import { Menu, Shield, User, X, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { NavItem, SectionId } from "./types";

type NavbarProps = {
  activeSection: SectionId;
  items: NavItem[];
  onNavigate: (sectionId: SectionId) => void;
};

export function Navbar({ activeSection, items, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (sectionId: SectionId) => {
    onNavigate(sectionId);
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <button
          type="button"
          className="brand-mark"
          aria-label="Go to overview"
          onClick={() => handleNavigate("overview")}
        >
          <Image
            src="/lastmile.png"
            alt="Last-Mile Study Engine"
            width={707}
            height={353}
            priority
            className="brand-logo-image brand-logo-main"
          />
          <Image
            src="/last-mile-short.png"
            alt="Last-Mile Study Engine"
            width={1280}
            height={1280}
            className="brand-logo-image brand-logo-short"
          />
        </button>

        <div className="desktop-nav-links">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link hover-glow-text ${activeSection === item.id ? "is-active" : ""
                }`}
              onClick={() => handleNavigate(item.id)}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
          <span className="nav-divider" />
          <a className="nav-link nav-launch hover-glow-text" href="/launch">
            Launch App <ArrowUpRight size={14} />
          </a>
          <span className="nav-security-badge" aria-hidden="true">
            <Shield size={13} />
          </span>
        </div>

        <a href="/account" className="account-link hover-glow-text">
          <User size={16} />
          <span className="account-label">Create Account</span>
        </a>

        <button
          type="button"
          className="mobile-menu-button hover-glow-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-nav-panel" id="mobile-navigation">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-link hover-glow-text ${activeSection === item.id ? "is-active" : ""
                }`}
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          <a className="mobile-nav-link hover-glow-text" href="/launch">
            Launch App <ArrowUpRight size={14} />
          </a>
        </div>
      )}
    </header>
  );
}
