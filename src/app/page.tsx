"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface TickerItem {
  icon: string;
  label: string;
}

interface WfContentLine {
  cls: string;
  style?: React.CSSProperties;
}

export default function Home() {
  // --- States ---
  const [activeWfTab, setActiveWfTab] = useState<"homepage" | "seo" | "faq" | "gbp">("homepage");
  const [timeText, setTimeText] = useState("5 minutes.");
  const [heroInput, setHeroInput] = useState("");
  const [counts, setCounts] = useState({ businesses: 0, time: 0, sections: 0 });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // --- Refs for Intersection Observers ---
  const revealsRef = useRef<HTMLDivElement[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);

  // --- Rotating Time Text Effect ---
  useEffect(() => {
    const times = ["5 minutes.", "10 minutes.", "5 minutes."];
    let ti = 0;
    const interval = setInterval(() => {
      ti = (ti + 1) % times.length;
      setTimeText(times[ti]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Intersection Observer for Scroll Reveals ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-reveal-id");
            if (id) {
              setRevealed((prev) => ({ ...prev, [id]: true }));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    revealsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // --- Count Up Animation Effect ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate count stats
            const duration = 1400;
            const start = performance.now();
            
            const animate = (now: number) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              
              setCounts({
                businesses: Math.round(eased * 847),
                time: Math.round(eased * 2), // Representing 2-5 min
                sections: Math.round(eased * 6),
              });
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            
            requestAnimationFrame(animate);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) observer.observe(counterRef.current);

    return () => observer.disconnect();
  }, []);

  // --- Helper to register reveal elements ---
  const addToReveals = (el: HTMLDivElement | null, id: string) => {
    if (el && !revealsRef.current.includes(el)) {
      el.setAttribute("data-reveal-id", id);
      revealsRef.current.push(el);
    }
  };

  // --- Handlers ---
  const handleHeroCta = (e: React.MouseEvent) => {
    e.preventDefault();
    if (heroInput.trim()) {
      // In the full app, redirect to dashboard with search param
      window.location.href = `/dashboard?url=${encodeURIComponent(heroInput)}`;
    } else {
      const inputEl = document.getElementById("hero-input");
      if (inputEl) inputEl.focus();
    }
  };

  // --- Data ---
  const tickerItems: TickerItem[] = [
    { icon: "🎂", label: "<strong>@sugarcraft.ng</strong> - 6 posts extracted" },
    { icon: "💇", label: "<strong>@glowbylara</strong> - homepage copy generated" },
    { icon: "👗", label: "<strong>@fashionbykemi</strong> - SEO keywords ready" },
    { icon: "🏋️", label: "<strong>@fitatfifty.ng</strong> - services page created" },
    { icon: "🍔", label: "<strong>@burgerspot.abj</strong> - Google Business written" },
    { icon: "📸", label: "<strong>@pixelstudio.ng</strong> - FAQs generated" },
    { icon: "🌺", label: "<strong>@blossomevents</strong> - 12 posts extracted" },
    { icon: "👠", label: "<strong>@zeehshoes</strong> - testimonials section done" },
  ];

  const doubledTickerItems = [...tickerItems, ...tickerItems];

  const wfContents: Record<"homepage" | "seo" | "faq" | "gbp", WfContentLine[]> = {
    homepage: [
      { cls: "head", style: { background: "rgba(255,255,255,.18)" } },
      { cls: "l1" },
      { cls: "l2" },
      { cls: "l3" },
      { cls: "l5 l4", style: { background: "rgba(255,255,255,.08)" } },
      { cls: "l1" },
      { cls: "", style: { width: "60%", height: "13px", borderRadius: "6px" } },
    ],
    seo: [
      { cls: "head", style: { background: "rgba(0,153,255,.2)" } },
      { cls: "", style: { width: "55%", height: "13px" } },
      { cls: "", style: { width: "70%", height: "13px" } },
      { cls: "", style: { width: "62%", height: "13px" } },
      { cls: "", style: { width: "80%", height: "13px" } },
      { cls: "l5", style: { background: "rgba(0,153,255,.1)" } },
      { cls: "", style: { width: "68%", height: "13px" } },
    ],
    faq: [
      { cls: "head", style: { background: "rgba(255,122,61,.2)" } },
      { cls: "l2" },
      { cls: "l3" },
      { cls: "l5", style: { background: "rgba(255,122,61,.1)" } },
      { cls: "l1" },
      { cls: "l3" },
      { cls: "", style: { width: "65%", height: "13px" } },
    ],
    gbp: [
      { cls: "head", style: { background: "rgba(34,197,94,.2)" } },
      { cls: "l1" },
      { cls: "l4" },
      { cls: "l2" },
      { cls: "l5", style: { background: "rgba(34,197,94,.1)" } },
      { cls: "l3" },
      { cls: "", style: { width: "77%", height: "13px" } },
    ],
  };

  return (
    <div className="bg-canvas text-ink min-h-screen font-body flex flex-col">
      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-14 bg-canvas/85 border-b border-hair-soft backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-md font-semibold tracking-tight text-ink">
          <span className="w-6 h-6 bg-violet rounded-lg flex items-center justify-center text-xs font-bold text-white">G</span>
          Grám
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <a href="#how" className="text-ink-muted text-sm font-medium px-3 py-1.5 rounded-lg hover:text-ink hover:bg-s1 transition-colors">How it works</a>
          <a href="#features" className="text-ink-muted text-sm font-medium px-3 py-1.5 rounded-lg hover:text-ink hover:bg-s1 transition-colors">Features</a>
          <a href="#pricing" className="text-ink-muted text-sm font-medium px-3 py-1.5 rounded-lg hover:text-ink hover:bg-s1 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-ink text-sm font-medium px-3.5 py-2 rounded-full bg-s1 hover:bg-s2 transition-colors">
            Sign in
          </Link>
          <Link href="/dashboard" className="text-black text-sm font-medium px-3.5 py-2 rounded-full bg-white hover:opacity-90 transition-opacity">
            Start free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="pt-24 pb-20 overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-8">
          {/* <div ref={(el) => addToReveals(el, "hero-eyebrow")} className={`transition-all duration-700 ${revealed["hero-eyebrow"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="inline-flex items-center gap-2 bg-s1 border border-hair rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-muted mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
              Instagram to Website Generator
            </div>
          </div> */}

          <h1 ref={(el) => addToReveals(el, "hero-title")} className={`disp-xl mb-6 transition-all duration-700 delay-100 ${revealed["hero-title"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            Turn any Instagram<br />
            <span style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,.3)" }}>page into a website</span><br />
            in <span className="text-ink transition-all duration-300">{timeText}</span>
          </h1>

          <p ref={(el) => addToReveals(el, "hero-sub")} className={`subhead max-w-[520px] mb-10 transition-all duration-700 delay-200 ${revealed["hero-sub"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            Scrape any public Instagram profile. Extract posts, captions, contact info and highlights. Then let AI generate a complete website - copy, SEO, FAQs, and more.
          </p>

          <div ref={(el) => addToReveals(el, "hero-cta")} className={`flex items-center gap-3 flex-wrap mb-16 transition-all duration-700 delay-300 ${revealed["hero-cta"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="flex items-center gap-2 bg-s1 border border-hair rounded-xl px-4.5 py-1.5 w-full max-w-[420px] transition-all focus-within:border-blue/40 focus-within:shadow-[0_0_0_3px_rgba(0,153,255,0.1)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(153,153,153,.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              <input
                id="hero-input"
                type="text"
                value={heroInput}
                onChange={(e) => setHeroInput(e.target.value)}
                placeholder="instagram.com/yourbusiness or @handle"
                className="flex-1 bg-transparent border-none outline-none text-ink text-sm py-1.5 placeholder-ink-muted"
                autoComplete="off"
                onKeyDown={(e) => { if (e.key === "Enter") handleHeroCta(e as any); }}
              />
            </div>
            <button onClick={handleHeroCta} className="bg-white text-black font-medium text-sm px-4.5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.97]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              Extract &amp; Build
            </button>
          </div>

          <div ref={counterRef} className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pt-10 border-t border-hair-soft">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-ink">{counts.businesses}+</span>
              <span className="text-xs text-ink-muted mt-1">Businesses processed</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-ink">{counts.time}-5 min</span>
              <span className="text-xs text-ink-muted mt-1">Per website build</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-ink">{counts.sections} sections</span>
              <span className="text-xs text-ink-muted mt-1">AI-generated instantly</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-ink">₦0</span>
              <span className="text-xs text-ink-muted mt-1">No credit card required</span>
            </div>
          </div>
        </div>

        {/* TICKER */}
        <div className="mt-16 overflow-hidden border-y border-hair-soft py-4 relative before:absolute before:left-0 before:top-0 before:w-30 before:h-full before:z-10 before:bg-gradient-to-r before:from-canvas before:to-transparent after:absolute after:right-0 after:top-0 after:w-30 after:h-full after:z-10 after:bg-gradient-to-l after:from-canvas after:to-transparent">
          <div className="flex gap-12 w-max animate-[tick_30s_linear_infinite]">
            {doubledTickerItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-medium text-ink-muted whitespace-nowrap">
                <span className="text-base">{item.icon}</span>
                <span dangerouslySetInnerHTML={{ __html: item.label }}></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="pt-0 pb-20">
        <div className="max-w-[1100px] mx-auto px-8">
          <div ref={(el) => addToReveals(el, "how-header")} className={`transition-all duration-700 ${revealed["how-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue tracking-wide uppercase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              How it works
            </div>
            <h2 className="disp-lg mt-3 max-w-[600px]">From profile URL to website copy in 3 steps.</h2>
          </div>

          <div ref={(el) => addToReveals(el, "how-steps")} className={`grid md:grid-cols-3 gap-0.25 bg-hair rounded-2xl overflow-hidden mt-16 transition-all duration-700 delay-100 ${revealed["how-steps"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="bg-s1 p-8 hover:bg-s2 transition-colors duration-200">
              <div className="text-xs font-medium text-ink-muted tracking-wider mb-6">01 / 03</div>
              <div className="w-11 h-11 rounded-xl bg-violet/20 flex items-center justify-center text-violet-400 text-lg mb-5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a08af8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2.5">Paste the Instagram URL</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Drop any public Instagram business profile link. Grám opens it, scrolls automatically, and collects everything - bio, posts, highlights, contact details.</p>
            </div>

            <div className="bg-s1 p-8 hover:bg-s2 transition-colors duration-200">
              <div className="text-xs font-medium text-ink-muted tracking-wider mb-6">02 / 03</div>
              <div className="w-11 h-11 rounded-xl bg-magenta/20 flex items-center justify-center text-magenta text-lg mb-5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e87ef7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2.5">We extract everything</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Business name, bio, address, phone number, all post captions, image URLs, highlights covers, and follower statistics - saved into one clean data package.</p>
            </div>

            <div className="bg-s1 p-8 hover:bg-s2 transition-colors duration-200">
              <div className="text-xs font-medium text-ink-muted tracking-wider mb-6">03 / 03</div>
              <div className="w-11 h-11 rounded-xl bg-orange/20 flex items-center justify-center text-orange-400 text-lg mb-5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff9f70" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2.5">AI generates your website</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Claude AI reads every caption and writes homepage copy, service pages, FAQs, SEO keywords, testimonials, and a complete Google Business Profile description.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="max-w-[1100px] mx-auto px-8">
          <div ref={(el) => addToReveals(el, "feat-header")} className={`transition-all duration-700 ${revealed["feat-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue tracking-wide uppercase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              What Grám does
            </div>
            <h2 className="disp-lg mt-3 max-w-[640px]">Every tool your agency needs. One platform.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mt-12">
            {/* Spotlight 1 */}
            <div ref={(el) => addToReveals(el, "feat-card-1")} className={`bg-violet p-8 rounded-2xl hover:brightness-108 transition-all duration-700 ${revealed["feat-card-1"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-white">Deep profile extraction</h3>
              <p className="text-sm text-white/75 leading-relaxed mb-6">Bio, contact info, address, follower count, all post captions, image URLs, story highlights - captured in one pass with zero login needed.</p>
              <div className="flex flex-wrap gap-1.5">
                {["Bio & contact", "All captions", "Highlights", "Post images"].map((tag) => (
                  <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/12 text-white/85">{tag}</span>
                ))}
              </div>
            </div>

            {/* Spotlight 2 */}
            <div ref={(el) => addToReveals(el, "feat-card-2")} className={`bg-magenta p-8 rounded-2xl hover:brightness-108 transition-all duration-700 delay-100 ${revealed["feat-card-2"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-white">AI website copy - 6 sections</h3>
              <p className="text-sm text-white/75 leading-relaxed mb-6">Claude AI reads every caption and generates homepage, services, FAQs, SEO keywords, testimonials, and Google Business Profile. Ready to paste into any website builder.</p>
              <div className="flex flex-wrap gap-1.5">
                {["Homepage copy", "Service pages", "SEO keywords", "FAQs"].map((tag) => (
                  <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/12 text-white/85">{tag}</span>
                ))}
              </div>
            </div>

            {/* Normal Card 1 */}
            <div ref={(el) => addToReveals(el, "feat-card-3")} className={`bg-s1 p-8 rounded-2xl border border-hair hover:bg-s2 transition-all duration-700 ${revealed["feat-card-3"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div className="w-10 h-10 rounded-lg bg-s2 flex items-center justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">Export to Google Sheets</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">Every extracted field - profile data, all captions, AI-generated copy - exported as a clean CSV or pushed directly to Google Sheets. Perfect for client handoffs.</p>
              <div className="flex flex-wrap gap-1.5">
                {["CSV export", "Google Sheets"].map((tag) => (
                  <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-hair text-ink-muted">{tag}</span>
                ))}
              </div>
            </div>

            {/* Normal Card 2 */}
            <div ref={(el) => addToReveals(el, "feat-card-4")} className={`bg-s1 p-8 rounded-2xl border border-hair hover:bg-s2 transition-all duration-700 delay-100 ${revealed["feat-card-4"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div className="w-10 h-10 rounded-lg bg-s2 flex items-center justify-center mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">Automatic scroll &amp; collect</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">Grám scrolls the profile automatically, visiting each post to extract captions and metadata. No manual clicking. Handles profiles with hundreds of posts.</p>
              <div className="flex flex-wrap gap-1.5">
                {["Auto-scroll", "Bulk posts", "Video support"].map((tag) => (
                  <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-hair text-ink-muted">{tag}</span>
                ))}
              </div>
            </div>

            {/* Wide Card */}
            <div ref={(el) => addToReveals(el, "feat-card-5")} className={`bg-s1 p-8 rounded-2xl border border-hair hover:bg-s2 transition-all duration-700 col-span-1 md:col-span-2 grid md:grid-cols-2 gap-10 items-center ${revealed["feat-card-5"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div>
                <div className="w-10 h-10 rounded-lg bg-s2 flex items-center justify-center mb-5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">Google Business Profile generator</h3>
                <p className="text-sm text-ink-muted leading-relaxed">AI writes a keyword-optimised Google Business Profile description from the Instagram data - including 5 services to list and 3 post ideas. Built for Nigerian local SEO.</p>
              </div>
              <div className="bg-s2 rounded-xl p-5 border border-hair">
                <div className="text-[11px] font-semibold text-ink-muted tracking-wider mb-3 uppercase">GBP preview</div>
                <h4 className="text-[13px] font-semibold mb-1">SugarCraft Nigeria</h4>
                <div className="text-xs text-ink-muted mb-3">Bakery · Lekki Phase 1, Lagos</div>
                <p className="text-xs text-white/65 leading-relaxed mb-3.5">Lagos's premier custom cake studio. Specialising in wedding cakes, corporate orders, and luxury birthday designs. Same-day delivery across Lagos Island and Mainland...</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["Custom Cakes", "Cupcakes", "Delivery"].map((srv) => (
                    <span key={srv} className="text-[11px] px-2 py-0.5 rounded-full bg-green/15 text-green font-medium">{srv}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE PREVIEW (WORKFLOW) */}
      <section id="workflow" className="py-20">
        <div className="max-w-[1100px] mx-auto px-8">
          <div ref={(el) => addToReveals(el, "wf-header")} className={`transition-all duration-700 ${revealed["wf-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue tracking-wide uppercase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
              Live tool preview
            </div>
            <h2 className="disp-lg mt-3">See what you get from one Instagram URL.</h2>
          </div>

          <div ref={(el) => addToReveals(el, "wf-container")} className={`bg-s1 rounded-3xl overflow-hidden border border-hair mt-12 transition-all duration-700 delay-100 ${revealed["wf-container"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="p-5 px-7 border-b border-hair flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="flex-1 bg-s2 rounded-lg py-1.5 px-3.5 text-xs text-ink-muted ml-4 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(153,153,153,.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                gram.app/extract?url=instagram.com/sugarcraft.ng
              </div>
            </div>
            
            <div className="grid md:grid-cols-[1fr_1.2fr] divide-y md:divide-y-0 md:divide-x divide-hair">
              {/* Data panel left */}
              <div className="p-7">
                <div className="text-[11px] font-bold text-ink-muted tracking-wider mb-4 uppercase">Extracted data</div>
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-12 h-12 rounded-full bg-violet flex items-center justify-center text-base font-bold text-white">SC</div>
                  <div>
                    <h4 className="text-sm font-semibold tracking-tight text-ink">SugarCraft Nigeria</h4>
                    <span className="text-xs text-ink-muted">@sugarcraft.ng · Bakery</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-s2 rounded-xl p-3 text-center">
                    <span className="text-[17px] font-bold tracking-tight">187</span>
                    <div className="text-[10px] text-ink-muted mt-0.5">Posts</div>
                  </div>
                  <div className="bg-s2 rounded-xl p-3 text-center">
                    <span className="text-[17px] font-bold tracking-tight">4.2K</span>
                    <div className="text-[10px] text-ink-muted mt-0.5">Followers</div>
                  </div>
                  <div className="bg-s2 rounded-xl p-3 text-center">
                    <span className="text-[17px] font-bold tracking-tight">612</span>
                    <div className="text-[10px] text-ink-muted mt-0.5">Following</div>
                  </div>
                </div>

                <div className="text-xs text-ink-muted mb-2.5">Recent posts collected</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Wedding cake gold leaf ✨", "Birthday princess cake 🎀", "Red velvet cupcakes", "Corporate delivery 🏦", "Cheesecake friday", "Behind the scenes 💪"].map((pst, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-s2 flex items-center justify-center text-[10px] text-ink-muted text-center p-1.5 leading-tight">
                      {pst}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-1.5 flex-wrap">
                  {["14 Admiralty Way, Lekki", "08012345678", "6 highlights"].map((badge) => (
                    <span key={badge} className="text-[11px] px-2.5 py-1 rounded-full bg-s2 text-ink-muted">{badge}</span>
                  ))}
                </div>
              </div>

              {/* AI output right */}
              <div className="p-7">
                <div className="text-[11px] font-bold text-ink-muted tracking-wider mb-4 uppercase">AI-generated content</div>
                <div className="flex gap-1 mb-4 flex-wrap">
                  {(["homepage", "seo", "faq", "gbp"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveWfTab(tab)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border border-transparent transition-colors capitalize ${
                        activeWfTab === tab ? "bg-white text-black" : "bg-s2 text-ink-muted hover:bg-hair"
                      }`}
                    >
                      {tab === "gbp" ? "Google Business" : tab}
                    </button>
                  ))}
                </div>

                <div className="bg-s2 rounded-xl p-4.5 min-h-[190px] transition-opacity duration-300">
                  {wfContents[activeWfTab].map((line, index) => (
                    <div
                      key={index}
                      className={`h-3 rounded-md bg-hair mb-2 ${line.cls}`}
                      style={line.style}
                    />
                  ))}
                </div>

                <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs text-ink-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  Copy text
                  <span className="mx-1 text-hair-soft">·</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Export CSV
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20">
        <div className="max-w-[1100px] mx-auto px-8">
          <div ref={(el) => addToReveals(el, "test-header")} className={`transition-all duration-700 ${revealed["test-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue tracking-wide uppercase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              From agencies using Grám
            </div>
            <h2 className="disp-lg mt-3">What web agencies say.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-12">
            {[
              {
                stars: "★★★★★",
                body: `"We used to spend 3 hours researching a client's business before we could write a single line of copy. Grám brings that down to 10 minutes. We've onboarded 12 new clients this month alone."`,
                initials: "AO",
                name: "Adebayo Okonkwo",
                role: "Founder, Orbit Digital Agency · Lagos",
                avColor: "rgba(106,76,245,.3)",
                avText: "#a08af8",
              },
              {
                stars: "★★★★★",
                body: `"The AI-generated copy is surprisingly good. I clean it up slightly and send it to the client - they always think I spent days writing it. The SEO keywords section alone is worth the price."`,
                initials: "CE",
                name: "Chioma Eze",
                role: "Web designer · Abuja",
                avColor: "rgba(212,77,240,.2)",
                avText: "#e87ef7",
              },
              {
                stars: "★★★★★",
                body: `"I pitch clients on Instagram DM, then immediately extract their profile to build a site spec. By the time we meet, I already have a full content outline and pricing. It's changed my whole sales process."`,
                initials: "BI",
                name: "Babatunde Ige",
                role: "Freelance developer · Port Harcourt",
                avColor: "rgba(255,122,61,.2)",
                avText: "#ff9f70",
              },
            ].map((test, index) => (
              <div
                key={index}
                ref={(el) => addToReveals(el, `test-card-${index}`)}
                className={`bg-s1 p-6 rounded-2xl border border-hair hover:border-hair-soft hover:-translate-y-0.5 transition-all duration-700 ${
                  index > 0 ? `delay-${index * 100}` : ""
                } ${revealed[`test-card-${index}`] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}
              >
                <div className="text-[#f5a623] text-sm mb-3 tracking-wider">{test.stars}</div>
                <p className="text-sm leading-relaxed text-white/80 mb-5">{test.body}</p>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: test.avColor, color: test.avText }}
                  >
                    {test.initials}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold tracking-tight text-ink">{test.name}</h4>
                    <span className="text-[11px] text-ink-muted">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20">
        <div className="max-w-[1100px] mx-auto px-8">
          <div ref={(el) => addToReveals(el, "pricing-header")} className={`transition-all duration-700 ${revealed["pricing-header"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue tracking-wide uppercase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              Simple pricing
            </div>
            <h2 className="disp-lg mt-3">Start free. Scale as your agency grows.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-12 items-stretch">
            {/* Starter */}
            <div ref={(el) => addToReveals(el, "pricing-card-1")} className={`bg-s1 rounded-2xl p-7 border border-hair flex flex-col transition-all duration-700 ${revealed["pricing-card-1"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">Starter</div>
              <div className="text-[40px] font-bold tracking-tight leading-none mb-1">
                <sup className="text-lg font-medium vertical-top mr-0.5">₦</sup>0
              </div>
              <div className="text-xs text-ink-muted mb-6">Free forever</div>
              <div className="h-px bg-hair mb-5" />
              <ul className="flex-1 space-y-2.5 mb-6">
                {["5 profile extractions / month", "All post captions + bio", "Homepage & services copy", "CSV export", "Email support"].map((feat) => (
                  <li key={feat} className="text-sm text-white/75 flex items-start gap-2 before:content-['✓'] before:text-green before:font-bold before:flex-shrink-0">{feat}</li>
                ))}
              </ul>
              <Link href="/dashboard" className="bg-s2 text-white font-medium text-sm py-2.5 rounded-full inline-flex justify-center transition-colors hover:bg-hair">
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div ref={(el) => addToReveals(el, "pricing-card-2")} className={`bg-s2 rounded-2xl p-7 border border-white/12 flex flex-col transition-all duration-700 delay-100 ${revealed["pricing-card-2"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Pro</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/12 text-ink">Most popular</span>
              </div>
              <div className="text-[40px] font-bold tracking-tight leading-none mb-1">
                <sup className="text-lg font-medium vertical-top mr-0.5">₦</sup>15,000
              </div>
              <div className="text-xs text-ink-muted mb-6">per month · billed monthly</div>
              <div className="h-px bg-hair mb-5" />
              <ul className="flex-1 space-y-2.5 mb-6">
                {["50 profile extractions / month", "Full data package incl. highlights", "All 6 AI content sections", "Google Sheets integration", "Sitemap & page structure", "Priority email support"].map((feat) => (
                  <li key={feat} className="text-sm text-white/75 flex items-start gap-2 before:content-['✓'] before:text-green before:font-bold before:flex-shrink-0">{feat}</li>
                ))}
              </ul>
              <Link href="/dashboard" className="bg-white text-black font-medium text-sm py-2.5 rounded-full inline-flex justify-center transition-opacity hover:opacity-90">
                Start Pro - ₦15k/mo
              </Link>
              <span className="text-[11px] text-ink-muted text-center mt-3">7-day free trial · no credit card</span>
            </div>

            {/* Agency */}
            <div ref={(el) => addToReveals(el, "pricing-card-3")} className={`bg-s1 rounded-2xl p-7 border border-hair flex flex-col transition-all duration-700 delay-200 ${revealed["pricing-card-3"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">Agency</div>
              <div className="text-[40px] font-bold tracking-tight leading-none mb-1">
                <sup className="text-lg font-medium vertical-top mr-0.5">₦</sup>45,000
              </div>
              <div className="text-xs text-ink-muted mb-6">per month · billed monthly</div>
              <div className="h-px bg-hair mb-5" />
              <ul className="flex-1 space-y-2.5 mb-6">
                {["Unlimited extractions", "Team seats (up to 5)", "White-label exports", "API access", "Bulk batch processing", "Dedicated support + onboarding"].map((feat) => (
                  <li key={feat} className="text-sm text-white/75 flex items-start gap-2 before:content-['✓'] before:text-green before:font-bold before:flex-shrink-0">{feat}</li>
                ))}
              </ul>
              <button className="bg-s2 text-white font-medium text-sm py-2.5 rounded-full inline-flex justify-center transition-colors hover:bg-hair">
                Talk to us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section id="cta-band" className="py-24 border-t border-hair-soft text-center bg-canvas">
        <div className="max-w-[1100px] mx-auto px-8">
          <div ref={(el) => addToReveals(el, "cta-content")} className={`transition-all duration-700 ${revealed["cta-content"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
            <h2 className="disp-lg mb-5">Your next client's website<br />starts with their Instagram.</h2>
            <p className="subhead max-w-[420px] mx-auto mb-10">Stop spending hours researching. Paste a URL and ship a website in 5 minutes.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/dashboard" className="bg-white text-black font-medium text-sm px-6 py-3 rounded-full transition-opacity hover:opacity-90">
                Start building free
              </Link>
              <a href="#workflow" className="bg-s1 text-white font-medium text-sm px-6 py-3 rounded-full border border-hair hover:bg-s2 transition-colors">
                See the tool
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-hair-soft bg-canvas py-16 px-8 mt-auto">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
            <div className="flex flex-col">
              <Link href="/" className="flex items-center gap-2 text-md font-semibold tracking-tight text-ink w-max">
                <span className="w-6 h-6 bg-violet rounded-lg flex items-center justify-center text-xs font-bold text-white">G</span>
                Grám
              </Link>
              <p className="text-sm text-ink-muted mt-3 leading-relaxed max-w-[260px]">
                Turn any public Instagram business profile into a complete website in minutes.
              </p>
            </div>
            
            {[
              {
                title: "Product",
                links: ["How it works", "Features", "Pricing", "API"],
              },
              {
                title: "Resources",
                links: ["Documentation", "Blog", "Case studies", "Changelog"],
              },
              {
                title: "Company",
                links: ["About", "Privacy", "Terms", "Contact"],
              },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col">
                <h4 className="text-xs font-semibold text-ink mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((lnk) => (
                    <li key={lnk}>
                      <a href="#" className="text-sm text-ink-muted hover:text-ink transition-colors">{lnk}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-hair-soft flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-ink-muted">© 2026 Grám. Built in Nigeria.</p>
            <p className="text-xs text-ink-muted">Made for Lagos agencies. Works everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
