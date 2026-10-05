"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ChevronDown,
  ChevronRight,
  History,
  LoaderCircle,
  LogOut,
  Menu,
  Moon,
  PencilLine,
  Plus,
  Search,
  Sun,
  Upload,
  User,
  X,
} from "lucide-react";
import { signOut, updateProfile, type User as FirebaseUser } from "firebase/auth";
import {
  ApiError,
  createSession,
  deleteSession,
  getSessionMessages,
  listDocuments,
  listSessions,
  sendChat,
  uploadDocument,
  type ApiDocument,
  type ApiMessage,
  type ApiSession,
  type StudyMode,
} from "../../lib/api";
import { getFirebaseAuth, subscribeToAuthState } from "../../lib/firebase";
import { StudyMarkdown } from "./StudyMarkdown";

const modes = [
  {
    name: "Panic Mode",
    description: "Fastest route through the noise",
    apiMode: "panic" as StudyMode,
  },
  {
    name: "Reverse Revision",
    description: "Work backward from the answer",
    apiMode: "reverse_revision" as StudyMode,
  },
  {
    name: "Deep Architecture",
    description: "Build the full learning map",
    apiMode: "deep_architecture" as StudyMode,
  },
  {
    name: "Exam Answers",
    description: "Structure answers for the examiner",
    apiMode: "exam_answers" as StudyMode,
  },
];

const recentSessions = [
  "Biology final revision",
  "Product strategy notes",
  "The last-mile study plan",
  "Chapter three summary",
  "Research questions",
];

type WorkspaceTheme = "dark" | "light";
type OpenSessionTab = {
  tabId: string;
  sessionId: string | null;
  title: string;
  mode: StudyMode;
};

const initialTabId = "draft-initial";

function getUserName(user: FirebaseUser): string {
  return user.displayName?.trim() || user.email?.split("@")[0] || "Your account";
}

function getUserInitials(user: FirebaseUser, nameOverride = ""): string {
  return (nameOverride.trim() || getUserName(user))
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
}

function matchesSearch(value: string, term: string): boolean {
  const keywords = term.toLowerCase().split(/\s+/).filter(Boolean);
  const normalizedValue = value.toLowerCase();
  return keywords.length > 0 && keywords.every((keyword) => normalizedValue.includes(keyword));
}

function createSessionTitle(question: string): string {
  const cleaned = question
    .replace(/^(please\s+|can you\s+|could you\s+|what is\s+|what are\s+|explain\s+|describe\s+|tell me about\s+|tell me\s+)/i, "")
    .replace(/\s+(and\s+)?(tell me|show me|give me|explain)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean).slice(0, 5);
  const shortTitle = words.join(" ").slice(0, 42).trim();

  if (!shortTitle) return "New session";
  return shortTitle.charAt(0).toUpperCase() + shortTitle.slice(1);
}

export function LaunchWorkspace() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedMode, setSelectedMode] = useState(0);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState(initialTabId);
  const [openSessionTabs, setOpenSessionTabs] = useState<OpenSessionTab[]>([
    { tabId: initialTabId, sessionId: null, title: "New session", mode: "panic" },
  ]);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<WorkspaceTheme>("dark");
  const [sessionSearchTerm, setSessionSearchTerm] = useState("");
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const chatSearchRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLElement | null>>({});
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!modeMenuRef.current?.contains(event.target as Node)) {
        setModeMenuOpen(false);
      }
      if (!chatSearchRef.current?.contains(event.target as Node)) {
        setChatSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("last-mile-theme");
    if (savedTheme !== "light") return;

    const timeout = window.setTimeout(() => setTheme("light"), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!highlightedMessageId) return;

    const timeout = window.setTimeout(() => setHighlightedMessageId(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [highlightedMessageId]);

  useEffect(() => {
    return subscribeToAuthState((user) => {
      setCurrentUser(user);
      setProfileName(user?.displayName || "");
      setProfileMessage(null);

      if (!user) {
        setSessions([]);
        setDocuments([]);
        setMessages([]);
        setActiveSessionId(null);
        return;
      }

      void Promise.all([listSessions(), listDocuments()])
        .then(([nextSessions, nextDocuments]) => {
          setSessions(nextSessions);
          setDocuments(nextDocuments);
        })
        .catch((error: unknown) => {
          setWorkspaceStatus(error instanceof Error ? error.message : "Workspace data could not be loaded.");
        });
    });
  }, []);

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    const nextName = profileName.trim();
    if (!nextName) {
      setProfileMessage("Enter a username before saving.");
      return;
    }

    try {
      await updateProfile(currentUser, { displayName: nextName });
      setProfileName(nextName);
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Your profile could not be updated.");
    }
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    try {
      await signOut(auth);
      setProfileOpen(false);
      router.replace("/account");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "You could not be signed out.");
    }
  };

  const handleToggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme: WorkspaceTheme = currentTheme === "dark" ? "light" : "dark";
      window.localStorage.setItem("last-mile-theme", nextTheme);
      return nextTheme;
    });
  };

  const handleSearchResultClick = (messageId: string) => {
    setSessionSearchTerm("");
    setSidebarOpen(false);
    setChatSearchOpen(false);
    setChatSearchTerm("");
    setHighlightedMessageId(messageId);
    window.requestAnimationFrame(() => {
      messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleChatSearchResultClick = (messageId: string) => {
    setChatSearchOpen(false);
    setChatSearchTerm("");
    setHighlightedMessageId(messageId);
    window.requestAnimationFrame(() => {
      messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleOpenSession = async (session: ApiSession) => {
    const requestVersion = ++requestVersionRef.current;
    const existingTab = openSessionTabs.find((tab) => tab.sessionId === session.id);
    const tabId = existingTab?.tabId || `session-${session.id}`;

    if (!existingTab) {
      setOpenSessionTabs((current) => [
        ...current,
        { tabId, sessionId: session.id, title: session.title, mode: session.mode },
      ]);
    }

    setActiveTabId(tabId);
    setIsBusy(true);
    setActiveSessionId(session.id);
    setSelectedMode(
      Math.max(
        0,
        modes.findIndex((mode) => mode.apiMode === session.mode),
      ),
    );
    setMessages([]);
    setWorkspaceStatus("Loading session history…");
    setSidebarOpen(false);
    setSessionSearchTerm("");
    setChatSearchOpen(false);
    setChatSearchTerm("");

    try {
      const history = await getSessionMessages(session.id);
      if (requestVersion !== requestVersionRef.current) return;
      setMessages(history);
      setWorkspaceStatus(null);
    } catch (error) {
      if (requestVersion !== requestVersionRef.current) return;
      setWorkspaceStatus(
        error instanceof Error
          ? error.message
          : "The session history could not be loaded.",
      );
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setIsBusy(false);
      }
    }
  };

  const handleActivateDraftTab = (tab: OpenSessionTab) => {
    requestVersionRef.current += 1;
    setActiveTabId(tab.tabId);
    setActiveSessionId(null);
    setSelectedMode(Math.max(0, modes.findIndex((mode) => mode.apiMode === tab.mode)));
    setMessages([]);
    setWorkspaceStatus(null);
    setSidebarOpen(false);
    setSessionSearchTerm("");
    setChatSearchOpen(false);
    setChatSearchTerm("");
    messageRefs.current = {};
  };

  const handleActivateTab = (tab: OpenSessionTab) => {
    if (!tab.sessionId) {
      handleActivateDraftTab(tab);
      return;
    }

    const session = sessions.find((candidate) => candidate.id === tab.sessionId);
    if (session) {
      void handleOpenSession(session);
    }
  };

  const handleCloseTab = (tabId: string) => {
    if (openSessionTabs.length === 1) {
      const onlyTab = openSessionTabs[0];
      const resetTab = { ...onlyTab, sessionId: null, title: "New session" };
      setOpenSessionTabs([resetTab]);
      handleActivateDraftTab(resetTab);
      return;
    }

    const remainingTabs = openSessionTabs.filter((tab) => tab.tabId !== tabId);
    setOpenSessionTabs(remainingTabs);

    if (tabId !== activeTabId) return;

    const nextTab = remainingTabs[remainingTabs.length - 1];
    if (nextTab) {
      handleActivateTab(nextTab);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || isBusy) return;

    const requestVersion = requestVersionRef.current;
    const userMessageId = `local-user-${Date.now()}`;
    let createdSessionId: string | null = null;
    let retriedForService = false;
    setIsBusy(true);
    setWorkspaceStatus(null);
    setPrompt("");

    try {
      const selectedStudyMode = modes[selectedMode].apiMode;
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createSession(createSessionTitle(question), selectedStudyMode);
        if (requestVersion !== requestVersionRef.current) return;

        sessionId = session.id;
        createdSessionId = session.id;
        setActiveSessionId(session.id);
        setOpenSessionTabs((current) => current.map((tab) => (
          tab.tabId === activeTabId
            ? { ...tab, sessionId: session.id, title: session.title, mode: selectedStudyMode }
            : tab
        )));
        setSessions((current) => [session, ...current]);
      }

      if (requestVersion !== requestVersionRef.current) return;

      const userMessage: ApiMessage = {
        id: userMessageId,
        session_id: sessionId,
        user_id: "",
        role: "user",
        content: question,
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [...current, userMessage]);

      const result = await (async () => {
        try {
          return await sendChat(sessionId, question, selectedStudyMode);
        } catch (error) {
          if (!(error instanceof ApiError) || error.status < 500) {
            throw error;
          }

          retriedForService = true;
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          return sendChat(sessionId, question, selectedStudyMode);
        }
      })();
      if (requestVersion !== requestVersionRef.current) return;

      const assistantMessage: ApiMessage = {
        id: result.message_id,
        session_id: result.session_id,
        user_id: "",
        role: "assistant",
        content: result.answer,
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      if (createdSessionId) {
        await deleteSession(createdSessionId).catch(() => undefined);
        if (requestVersion === requestVersionRef.current) {
          setSessions((current) => current.filter((session) => session.id !== createdSessionId));
          setActiveSessionId(null);
          setOpenSessionTabs((current) => current.map((tab) => (
            tab.tabId === activeTabId
              ? { ...tab, sessionId: null, title: "New session" }
              : tab
          )));
        }
      }

      if (requestVersion !== requestVersionRef.current) return;

      setMessages((current) => current.filter((message) => message.id !== userMessageId));
      if (retriedForService || (error instanceof ApiError && error.status >= 500)) {
        setWorkspaceStatus(null);
      } else {
        setWorkspaceStatus(error instanceof Error ? error.message : "Your question could not be sent.");
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setIsBusy(false);
      }
    }
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    if (!isBusy && prompt.trim()) {
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
  };

  const handleNewSession = () => {
    requestVersionRef.current += 1;
    const tabId = `draft-${Date.now()}`;
    setOpenSessionTabs((current) => [
      ...current,
      { tabId, sessionId: null, title: "New session", mode: modes[selectedMode].apiMode },
    ]);
    setActiveTabId(tabId);
    setPrompt("");
    setMessages([]);
    setActiveSessionId(null);
    setWorkspaceStatus(null);
    setSidebarOpen(false);
    setProfileOpen(false);
    setSessionSearchTerm("");
    setChatSearchOpen(false);
    setChatSearchTerm("");
    messageRefs.current = {};
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsBusy(true);
    setWorkspaceStatus(`Uploading ${file.name}…`);
    try {
      const document = await uploadDocument(file);
      setDocuments((current) => [document, ...current]);
      setWorkspaceStatus(null);
    } catch (error) {
      setWorkspaceStatus(error instanceof Error ? error.message : "The PDF could not be uploaded.");
    } finally {
      setIsBusy(false);
    }
  };

  const visibleSessions = sessions.length > 0 ? sessions : null;
  const normalizedSearchTerm = sessionSearchTerm.trim().toLowerCase();
  const searchResults = normalizedSearchTerm
    ? messages.filter((message) => matchesSearch(message.content, normalizedSearchTerm))
    : [];
  const normalizedChatSearchTerm = chatSearchTerm.trim().toLowerCase();
  const chatSearchResults = normalizedChatSearchTerm
    ? messages.filter((message) => matchesSearch(message.content, normalizedChatSearchTerm))
    : [];
  const sessionSearchResults = normalizedSearchTerm
    ? (visibleSessions || []).filter((session) => matchesSearch(session.title, normalizedSearchTerm))
    : [];

  return (
    <div className={`launch-page ${theme === "light" ? "is-light" : ""}`}>
      <div className="launch-background" aria-hidden="true">
        <div className="launch-glow launch-glow-one" />
        <div className="launch-glow launch-glow-two" />
        <div className="launch-grid" />
      </div>

      <header className="launch-topbar">
        <div className="launch-topbar-left">
          <button
            type="button"
            className="launch-icon-button hover-glow-button"
            aria-label="Open workspace sidebar"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="launch-session-tabs" role="tablist" aria-label="Open sessions">
            {openSessionTabs.map((tab) => (
              <div className={`launch-session-tab ${tab.tabId === activeTabId ? "is-active" : ""}`} key={tab.tabId}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab.tabId === activeTabId}
                  className="launch-session-tab-trigger"
                  onClick={() => handleActivateTab(tab)}
                >
                  <PencilLine size={17} />
                  <span>{tab.title}</span>
                </button>
                <button
                  type="button"
                  className="launch-session-close hover-glow-text"
                  aria-label={`Close ${tab.title}`}
                  onClick={() => handleCloseTab(tab.tabId)}
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="launch-icon-button launch-add-button hover-glow-button" aria-label="New session" onClick={handleNewSession}>
            <Plus size={18} />
          </button>
        </div>

        <div className="launch-topbar-right">
          <Image
            src="/lastmile.png"
            alt="Last-Mile Study Engine"
            width={707}
            height={353}
            className="brand-logo-image brand-logo-main launch-app-logo"
          />
          <Image
            src="/last-mile-short.png"
            alt="Last-Mile Study Engine"
            width={1280}
            height={1280}
            className="brand-logo-image brand-logo-short launch-app-short-logo"
          />
        </div>
      </header>

      {sidebarOpen && (
        <>
          <button
            type="button"
            className="launch-sidebar-backdrop"
            aria-label="Close workspace sidebar"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="launch-sidebar" aria-label="Workspace sidebar">
            <div className="launch-sidebar-header">
              <div className="launch-sidebar-title">
                <span className="brand-mark-core" />
                <strong>Workspace</strong>
              </div>
              <button
                type="button"
                className="launch-icon-button hover-glow-button"
                aria-label="Close workspace sidebar"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <button type="button" className="sidebar-new-session hover-glow-button" onClick={handleNewSession}>
              <Plus size={17} />
              New session
            </button>

            <div className="sidebar-session-search">
              <Search size={15} />
              <input
                value={sessionSearchTerm}
                onChange={(event) => setSessionSearchTerm(event.target.value)}
                placeholder="Search sessions and messages"
                aria-label="Search sessions and messages"
              />
            </div>

            {normalizedSearchTerm && (
              <div className="sidebar-search-results" aria-label="Search results">
                {sessionSearchResults.map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() => {
                      setSessionSearchTerm("");
                      void handleOpenSession(session);
                    }}
                  >
                    <strong>Session</strong>
                    <span>{session.title}</span>
                  </button>
                ))}
                {searchResults.map((message) => (
                  <button type="button" key={message.id} onClick={() => handleSearchResultClick(message.id)}>
                    <strong>{message.role === "assistant" ? "Last-Mile" : "Message"}</strong>
                    <span>{message.content}</span>
                  </button>
                ))}
                {sessionSearchResults.length === 0 && searchResults.length === 0 && (
                  <p>No matching sessions or messages.</p>
                )}
              </div>
            )}

            <div className="launch-sidebar-scroll">
              <div className="sidebar-section-label">Recent sessions</div>
              <nav className="recent-sessions" aria-label="Recent sessions">
                {visibleSessions
                  ? visibleSessions.map((session) => (
                    <button
                      type="button"
                      className="recent-session hover-glow-text"
                      key={session.id}
                      onClick={() => void handleOpenSession(session)}
                    >
                      <History size={15} />
                      <span>{session.title}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))
                  : recentSessions.map((session) => (
                    <button
                      type="button"
                      className="recent-session hover-glow-text"
                      key={session}
                      onClick={() => {
                        requestVersionRef.current += 1;
                        setOpenSessionTabs((current) => current.map((tab) => (
                          tab.tabId === activeTabId
                            ? { ...tab, sessionId: null, title: session }
                            : tab
                        )));
                        setActiveSessionId(null);
                        setMessages([]);
                        setSidebarOpen(false);
                      }}
                    >
                      <History size={15} />
                      <span>{session}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
              </nav>

              {documents.length > 0 && (
                <>
                  <div className="sidebar-section-label">Your documents</div>
                  <div className="workspace-documents" aria-label="Uploaded documents">
                    {documents.map((document) => (
                      <div className="workspace-document" key={document.id}>
                        <span><Upload size={14} />{document.original_filename}</span>
                        <small>{document.status}</small>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="launch-sidebar-bottom">
              {currentUser ? (
                <>
                  {profileOpen && (
                    <div className="sidebar-profile-panel">
                      <form className="sidebar-profile-form" onSubmit={handleSaveProfile}>
                        <label>
                          <span>Username</span>
                          <input
                            value={profileName}
                            onChange={(event) => setProfileName(event.target.value)}
                            placeholder="Your name"
                            maxLength={60}
                          />
                        </label>
                        <button type="submit" className="sidebar-profile-save hover-glow-button">
                          Save profile
                        </button>
                      </form>

                      {profileMessage && (
                        <p className="sidebar-profile-message" aria-live="polite">{profileMessage}</p>
                      )}

                      <div className="sidebar-profile-actions">
                        <button type="button" onClick={handleToggleTheme}>
                          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                          {theme === "dark" ? "Light mode" : "Dark mode"}
                        </button>
                        <button type="button" onClick={() => void handleSignOut()}>
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="sidebar-account hover-glow-card"
                    aria-label="Open profile"
                    aria-expanded={profileOpen}
                    onClick={() => setProfileOpen((open) => !open)}
                  >
                    <span className="sidebar-account-avatar">{getUserInitials(currentUser, profileName)}</span>
                    <span className="sidebar-account-copy">
                      <strong>{profileName.trim() || getUserName(currentUser)}</strong>
                      <small>{currentUser.email || "Signed-in account"}</small>
                    </span>
                  </button>
                </>
              ) : (
                <a href="/account" className="sidebar-account hover-glow-card">
                  <span className="sidebar-account-avatar"><User size={17} /></span>
                  <span className="sidebar-account-copy">
                    <strong>Create account</strong>
                    <small>Save your sessions and modes</small>
                  </span>
                </a>
              )}
            </div>
          </aside>
        </>
      )}

      <main className="launch-main">
        <div className="launch-wordmark" aria-hidden="true">
          <span></span>
        </div>

        <div className={`launch-composer-area ${messages.length > 0 ? "has-messages" : ""}`}>
          <form className="prompt-composer" onSubmit={handleSubmit}>
            <textarea
              value={prompt}
              onChange={(event) => handlePromptChange(event.target.value)}
              onKeyDown={handlePromptKeyDown}
              placeholder="Ask anything, / for commands, @ for context..."
              aria-label="Study prompt"
              rows={1}
              disabled={isBusy}
            />

            <div className="prompt-toolbar">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="visually-hidden"
                aria-label="Upload a PDF"
                onChange={handleUpload}
              />
              <button
                type="button"
                className="prompt-tool-button hover-glow-button"
                aria-label="Upload a PDF"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
              >
                <Plus size={21} />
              </button>

              <div className="mode-selector" ref={modeMenuRef}>
                <button
                  type="button"
                  className="mode-selector-trigger hover-glow-text"
                  onClick={() => setModeMenuOpen((open) => !open)}
                  aria-expanded={modeMenuOpen}
                  aria-haspopup="listbox"
                >
                  <span className="mode-selector-symbol">≡</span>
                  <span>{modes[selectedMode].name}</span>
                  <ChevronDown size={16} className={modeMenuOpen ? "is-open" : ""} />
                </button>

                {modeMenuOpen && (
                  <div className="mode-dropdown" role="listbox" aria-label="Study mode">
                    {modes.map((mode, index) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedMode === index}
                        className={`mode-dropdown-option hover-glow-text ${selectedMode === index ? "is-selected" : ""}`}
                        key={mode.name}
                        onClick={() => {
                          setSelectedMode(index);
                          setModeMenuOpen(false);
                        }}
                      >
                        <span>
                          <strong>{mode.name}</strong>
                          <small>{mode.description}</small>
                        </span>
                        <span className="mode-dropdown-index">0{index + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="session-search-control" ref={chatSearchRef}>
                <button
                  type="button"
                  className="session-search-trigger hover-glow-text"
                  aria-label="Search this chat"
                  aria-expanded={chatSearchOpen}
                  onClick={() => setChatSearchOpen((open) => !open)}
                >
                  <Search size={15} />
                  <span>Search</span>
                </button>

                {chatSearchOpen && (
                  <div className="session-search-panel" role="dialog" aria-label="Search this chat">
                    <div className="session-search-input-wrap">
                      <Search size={15} />
                      <input
                        autoFocus
                        value={chatSearchTerm}
                        onChange={(event) => setChatSearchTerm(event.target.value)}
                        placeholder="Search this chat"
                        aria-label="Search this chat"
                      />
                    </div>

                    <div className="session-search-results">
                      {chatSearchResults.length > 0 ? (
                        chatSearchResults.slice(0, 12).map((message) => (
                          <button
                            type="button"
                            key={message.id}
                            onClick={() => handleChatSearchResultClick(message.id)}
                          >
                            <strong>{message.role === "assistant" ? "Last-Mile" : "Message"}</strong>
                            <span>{message.content}</span>
                          </button>
                        ))
                      ) : (
                        <p>{normalizedChatSearchTerm ? "No matching messages." : "Type a keyword to search."}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="prompt-submit hover-glow-button"
                aria-label="Submit prompt"
                disabled={!prompt.trim() || isBusy}
              >
                {isBusy ? <LoaderCircle size={19} className="is-spinning" /> : <ArrowUp size={19} />}
              </button>
            </div>
          </form>

          <p className={`prompt-status ${workspaceStatus ? "is-visible" : ""}`} aria-live="polite">
            {workspaceStatus}
          </p>

          {messages.length > 0 && (
            <section className="launch-answer-card" aria-live="polite" aria-label="Session conversation">
              <div className="launch-chat-messages">
                {messages.map((message) => (
                  <article
                    className={`launch-chat-message is-${message.role} ${highlightedMessageId === message.id ? "is-search-match" : ""}`}
                    key={message.id}
                    ref={(node) => {
                      messageRefs.current[message.id] = node;
                    }}
                  >
                    {message.role === "assistant" && (
                      <div className="launch-chat-message-heading">
                        <Image
                          src="/last-mile-short.png"
                          alt="Last-Mile"
                          width={1280}
                          height={1280}
                          className="launch-chat-message-logo"
                        />
                      </div>
                    )}
                    {message.role === "assistant" ? (
                      <StudyMarkdown content={message.content} />
                    ) : (
                      <p className="launch-user-message">{message.content}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
