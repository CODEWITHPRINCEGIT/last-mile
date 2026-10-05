"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Shield,
  User,
} from "lucide-react";

import {
  getFirebaseAuth,
  isFirebaseConfigured,
  subscribeToAuthState,
} from "../../lib/firebase";

type AuthMode = "signup" | "signin";

const benefits = [
  "Save every study session",
  "Keep your modes and prompts together",
  "Return to your learning path anywhere",
];

export function AccountWorkspace() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToAuthState((user) => {
      if (user) {
        router.replace("/launch");
      }
    });
  }, [router]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!isFirebaseConfigured()) {
      setAuthMessage(
        "Add your NEXT_PUBLIC_FIREBASE_* settings to enable authentication.",
      );
      return;
    }

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "");

    const auth = getFirebaseAuth();

    if (!auth) {
      setAuthMessage(
        "Firebase authentication is not configured yet.",
      );
      return;
    }

    try {
      if (mode === "signup") {
        const credential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );

        if (name.trim()) {
          await updateProfile(credential.user, {
            displayName: name.trim(),
          });
        }

        setAuthMessage(null);
      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );

        setAuthMessage(null);
      }
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? error.message
          : "Authentication could not be completed.",
      );
    }
  };

  const handleGoogleContinue = async () => {
    if (!isFirebaseConfigured()) {
      setAuthMessage(
        "Add your NEXT_PUBLIC_FIREBASE_* settings to enable authentication.",
      );
      return;
    }

    const auth = getFirebaseAuth();

    if (!auth) {
      return;
    }

    try {
      await signInWithPopup(
        auth,
        new GoogleAuthProvider(),
      );

      setAuthMessage(null);
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? error.message
          : "Google authentication could not be completed.",
      );
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setAuthMessage(null);
  };

  return (
    <div className="account-page">
      <div
        className="account-background"
        aria-hidden="true"
      >
        <div className="account-glow account-glow-one" />
        <div className="account-glow account-glow-two" />
        <div className="account-stars" />
      </div>

      <header className="account-topbar">
        <Link
          href="/"
          className="account-brand hover-glow-text"
        >
          <Image
            src="/lastmile.png"
            alt="Last-Mile Study Engine"
            width={707}
            height={353}
            className="brand-logo-image brand-logo-main account-brand-logo"
          />
          <Image
            src="/last-mile-short.png"
            alt="Last-Mile Study Engine"
            width={1280}
            height={1280}
            className="brand-logo-image brand-logo-short account-brand-short-logo"
          />
        </Link>

        <Link
          href="/launch"
          className="account-back-link hover-glow-text"
        >
          <ArrowLeft size={15} />
          Back to workspace
        </Link>
      </header>

      <main className="account-main">
        <section className="account-intro">
          <div className="section-eyebrow">
            <span className="eyebrow-dot" />
            Your study space
          </div>

          <h1 className="account-title">
            Keep the work
            <span>moving forward.</span>
          </h1>

          <p className="account-copy">
            Create an account to keep your prompts, modes,
            and study sessions ready whenever you are.
          </p>

          <ul className="account-benefits">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <Check size={15} />
                {benefit}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="account-card"
          aria-label={
            mode === "signup"
              ? "Create account"
              : "Sign in"
          }
        >
          <div className="account-card-heading">
            <div className="account-card-icon">
              <Shield size={18} />
            </div>

            <div>
              <span className="account-kicker">
                {mode === "signup"
                  ? "New here"
                  : "Welcome back"}
              </span>

              <h2>
                {mode === "signup"
                  ? "Create your account"
                  : "Sign in to your space"}
              </h2>
            </div>
          </div>

          <div
            className="auth-mode-switch"
            role="tablist"
            aria-label="Account access"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`auth-mode-tab hover-glow-text ${mode === "signup" ? "is-active" : ""
                }`}
              onClick={() => changeMode("signup")}
            >
              Sign up
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={`auth-mode-tab hover-glow-text ${mode === "signin" ? "is-active" : ""
                }`}
              onClick={() => changeMode("signin")}
            >
              Sign in
            </button>
          </div>

          <form
            className="account-form"
            onSubmit={handleSubmit}
          >
            {mode === "signup" && (
              <label className="account-field">
                <span>Name</span>

                <span className="account-input-wrap">
                  <User size={16} />

                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </span>
              </label>
            )}

            <label className="account-field">
              <span>Email</span>

              <span className="account-input-wrap">
                <span className="account-input-symbol">
                  @
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label className="account-field">
              <span>Password</span>

              <span className="account-input-wrap">
                <span className="account-input-symbol">
                  •
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="At least 8 characters"
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle hover-glow-text"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (visible) => !visible,
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </span>
            </label>

            <button
              type="submit"
              className="account-submit button button-solid hover-glow-button"
            >
              {mode === "signup"
                ? "Create Account"
                : "Sign In"}

              <ArrowRight size={16} />
            </button>
          </form>

          <div className="account-divider">
            <span />
            or
            <span />
          </div>

          <button
            type="button"
            className="account-google-button hover-glow-button"
            onClick={handleGoogleContinue}
          >
            <span className="google-mark">G</span>
            Continue with Google
          </button>

          {authMessage && (
            <p
              className="account-form-status"
              aria-live="polite"
            >
              {authMessage}
            </p>
          )}

          <p className="account-switch-copy">
            {mode === "signup"
              ? "Already have an account?"
              : "Need a new account?"}{" "}

            <button
              type="button"
              className="account-switch-link hover-glow-text"
              onClick={() =>
                changeMode(
                  mode === "signup"
                    ? "signin"
                    : "signup",
                )
              }
            >
              {mode === "signup"
                ? "Sign in"
                : "Sign up"}
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}
