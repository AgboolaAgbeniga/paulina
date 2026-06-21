"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import JSZip from "jszip";

// Helper to convert Markdown to basic formatted HTML for PDF generation and preview
function mdToHtml(md: string): string {
  if (!md) return "";
  let html = md;
  // Escape HTML tags to prevent broken layout
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Headers
  html = html.replace(/^### (.*?)$/gm, "<h3 class='text-sm font-bold mt-4 mb-2 text-white border-b border-hair pb-1'>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2 class='text-md font-bold mt-5 mb-2 text-white border-b border-hair pb-1'>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1 class='text-lg font-bold mt-6 mb-3 text-white border-b border-hair pb-1'>$1</h1>");
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-white'>$1</strong>");
  // Bullet lists
  html = html.replace(/^[-\*] (.*?)$/gm, "<div style='margin-left: 15px; margin-bottom: 4px; opacity: 0.95;'>• $1</div>");
  // Numbered lists
  html = html.replace(/^\d+\. (.*?)$/gm, "<div style='margin-left: 15px; margin-bottom: 4px; opacity: 0.95;'>$1</div>");
  // Newlines
  html = html.replace(/\n\n/g, "<br/><br/>");
  html = html.replace(/\n/g, "<br/>");
  return html;
}

// Types
interface Post {
  caption: string;
  likes: number;
  date: string;
  media_url?: string;
  media_type?: string;
}

interface BusinessData {
  handle: string;
  name: string;
  bio: string;
  followers: string;
  following: string;
  posts_count: string;
  contact: string;
  address: string;
  website: string;
  category: string;
  highlights: string[];
  posts: Post[];
}



const AI_TABS = [
  { id: "copy", label: "Homepage copy", icon: "🏡" },
  { id: "services", label: "Services", icon: "📋" },
  { id: "faqs", label: "FAQs", icon: "❓" },
  { id: "seo", label: "SEO keywords", icon: "🔍" },
  { id: "testimonials", label: "Testimonials", icon: "⭐" },
  { id: "gbp", label: "Google Business", icon: "📍" }
];

function DashboardContent() {
  const searchParams = useSearchParams();

  // --- States ---
  const [phase, setPhase] = useState<"input" | "scraping" | "done">("input");
  const [url, setUrl] = useState("");
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeSteps, setScrapeSteps] = useState<{ msg: string; done: boolean }[]>([]);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [activeAiTab, setActiveAiTab] = useState<string>("copy");
  const [aiContent, setAiContent] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<{ username: string; business_name: string; industry: string }[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // --- Fetch Search History ---
  useEffect(() => {
    if (phase === "input") {
      fetch("/api/history")
        .then(res => res.json())
        .then(data => {
          if (data.history) setSearchHistory(data.history);
        })
        .catch(err => console.error("Failed to fetch history:", err));
    }
  }, [phase]);

  // --- Auto-trigger via search param ---
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      // Initiate scrape
      setPhase("scraping");
      setScrapeProgress(0);
      setScrapeSteps([]);
      triggerScrape(urlParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- Scrape Action Trigger ---
  const handleScrapeClick = () => {
    const val = url.trim();
    if (!val) {
      alert("Please enter an Instagram URL or handle.");
      return;
    }
    setPhase("scraping");
    setScrapeProgress(0);
    setScrapeSteps([]);
    triggerScrape(val);
  };

  // --- Real API Scraper Trigger ---
  const triggerScrape = async (targetUrl: string) => {
    try {
      setScrapeSteps([{ msg: "Connecting to server scraper...", done: false }]);
      setScrapeProgress(10);
      
      // Make real call to next api route
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(targetUrl)}`);
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Scraping failed.");
      }
      
      setScrapeProgress(80);
      setScrapeSteps(prev => [
        ...prev.map(s => ({ ...s, done: true })),
        { msg: "Scraped successfully. Generating profile details...", done: true }
      ]);
      
      setScrapeProgress(100);
      setBusiness(data.business);
      setPhase("done");
      setActiveAiTab("copy");
      setAiContent({});
      setGenerationError(null);
      
      // Auto generate all copy sections in parallel
      generateAll(data.business);
    } catch (err: any) {
      console.error("Scraping failed:", err.message);
      setScrapeSteps(prev => [
        ...prev.map(s => ({ ...s, done: true })),
        { msg: `Scraping failed: ${err.message}`, done: true }
      ]);
      setScrapeProgress(100);
    }
  };

  // --- Real AI Content Generation ---
  const generateRealAiContent = async (biz: BusinessData, tabId: string) => {
    setLoadingAi(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: biz, tabId })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to generate copy");
      }
      setAiContent(prev => ({ ...prev, [tabId]: result.text }));
    } catch (err: any) {
      console.error("AI Generation failed:", err.message);
      setGenerationError(err.message || "Failed to generate copy.");
    } finally {
      setLoadingAi(false);
    }
  };

  // --- Switch Tab Handler ---
  const handleTabChange = (tabId: string) => {
    setActiveAiTab(tabId);
    if (!aiContent[tabId] && business) {
      generateRealAiContent(business, tabId);
    } else {
      setGenerationError(null);
    }
  };

  // --- Generate All Sections Handler (Parallel) ---
  const generateAll = async (biz: BusinessData = business!) => {
    if (!biz) return;
    setLoadingAi(true);
    setGenerationError(null);
    try {
      await Promise.all(
        AI_TABS.map(async (tab) => {
          try {
            const response = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ business: biz, tabId: tab.id })
            });
            const result = await response.json();
            if (response.ok) {
              setAiContent(prev => ({ ...prev, [tab.id]: result.text }));
            }
          } catch (err) {
            console.error(`Failed to generate ${tab.id}:`, err);
          }
        })
      );
    } catch (err: any) {
      setGenerationError(err.message || "Error generating sections.");
    } finally {
      setLoadingAi(false);
    }
  };

  // --- Download all images as ZIP ---
  const downloadImagesZip = async () => {
    if (!business || !business.posts || business.posts.length === 0) return;
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("images");
      let count = 0;
      for (let i = 0; i < business.posts.length; i++) {
        const post = business.posts[i];
        if (post.media_url) {
          try {
            const originUrl = post.media_url.startsWith("/") 
              ? window.location.origin + post.media_url 
              : post.media_url;
            
            // Route through CORS proxy image route to guarantee success
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(originUrl)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error("Fetch failed");
            const blob = await res.blob();
            
            const contentType = res.headers.get("content-type") || "";
            const ext = contentType.split("/")[1] || "jpg";
            const filename = `${business.handle}_post_${i + 1}.${ext}`;
            
            imgFolder?.file(filename, blob);
            count++;
          } catch (e) {
            console.error(`Failed to download image ${i + 1}:`, e);
          }
        }
      }
      if (count > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${business.handle}-images.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("No images could be fetched to ZIP.");
      }
    } catch (err: any) {
      console.error("ZIP creation failed:", err);
      alert("Failed to create ZIP: " + err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  // --- Export CSV Handler ---
  const exportToSheets = () => {
    if (!business) return;

    const rows = [
      ["Field", "Value"],
      ["Business Name", business.name],
      ["Handle", "@" + business.handle],
      ["Category", business.category],
      ["Bio", business.bio.replace(/\n/g, " ")],
      ["Followers", business.followers],
      ["Posts Count", business.posts_count],
      ["Contact", business.contact],
      ["Address", business.address],
      [""],
      ["=== POST CAPTIONS ===", ""],
      ...business.posts.map((p, i) => [`Post ${i + 1} (${p.date})`, p.caption]),
      [""],
      ["=== HIGHLIGHTS ===", ""],
      ...business.highlights.map(h => ["Highlight", h]),
      [""],
      ["=== AI CONTENT ===", ""],
      ...AI_TABS.map(t => [t.label, aiContent[t.id] || "(not generated)"])
    ];

    const csvContent = rows
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
      
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.handle}-instagram-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadJson = () => {
    if (!business) return;
    const exportData = {
      extracted_at: new Date().toISOString(),
      business_details: {
        name: business.name,
        handle: business.handle,
        category: business.category,
        bio: business.bio,
        followers: business.followers,
        following: business.following,
        posts_count: business.posts_count,
        contact: business.contact,
        address: business.address,
        website: business.website,
        highlights: business.highlights
      },
      posts: business.posts.map(p => ({
        date: p.date,
        likes: p.likes,
        caption: p.caption,
        media_url: p.media_url,
        media_type: p.media_type
      })),
      generated_website_content: {
        homepage_copy: aiContent.copy || "",
        services: aiContent.services || "",
        faqs: aiContent.faqs || "",
        seo_keywords: aiContent.seo || "",
        testimonials: aiContent.testimonials || "",
        google_business_profile: aiContent.gbp || ""
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.handle}-website-content.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMarkdown = () => {
    if (!business) return;

    let md = `# Website Content Specification: ${business.name}\n\n`;
    md += `Generated on ${new Date().toLocaleDateString()} via Grám.\n\n`;
    
    md += `## 📋 Business Details\n`;
    md += `- **Handle:** @${business.handle}\n`;
    md += `- **Category:** ${business.category}\n`;
    md += `- **Followers:** ${business.followers}\n`;
    md += `- **Contact:** ${business.contact}\n`;
    md += `- **Address:** ${business.address}\n`;
    md += `- **Website:** ${business.website || "N/A"}\n\n`;
    
    md += `### 📝 Biography\n\`\`\`\n${business.bio}\n\`\`\`\n\n`;

    md += `---\n\n`;

    md += `## 🏡 1. Homepage Copy & CTA\n\n`;
    md += `${aiContent.copy || "(Not generated yet)"}\n\n`;

    md += `## 📋 2. Services & Offerings\n\n`;
    md += `${aiContent.services || "(Not generated yet)"}\n\n`;

    md += `## ❓ 3. Frequently Asked Questions (FAQs)\n\n`;
    md += `${aiContent.faqs || "(Not generated yet)"}\n\n`;

    md += `## 🔍 4. SEO Keywords & Meta Copy\n\n`;
    md += `${aiContent.seo || "(Not generated yet)"}\n\n`;

    md += `## ⭐ 5. Customer Testimonials\n\n`;
    md += `${aiContent.testimonials || "(Not generated yet)"}\n\n`;

    md += `## 📍 6. Google Business Profile (GBP)\n\n`;
    md += `${aiContent.gbp || "(Not generated yet)"}\n\n`;

    md += `---\n\n`;
    md += `## 📸 Extracted Instagram Posts\n\n`;
    business.posts.forEach((p, i) => {
      md += `### Post ${i + 1} (${p.date})\n`;
      md += `- **Likes:** ${p.likes}\n`;
      if (p.media_url) {
        md += `- **Image URL:** ${p.media_url}\n`;
      }
      md += `> ${p.caption.replace(/\n/g, "\n> ")}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.handle}-website-content.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    if (!business) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Website Content Spec - ${business.name}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            color: #111;
            line-height: 1.5;
            padding: 40px;
            font-size: 14px;
          }
          h1 { font-size: 26px; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-bottom: 5px; }
          h2 { font-size: 18px; color: #333; border-bottom: 1px solid #eaeaea; padding-bottom: 6px; margin-top: 30px; page-break-after: avoid; }
          h3 { font-size: 14px; color: #555; margin-top: 20px; }
          .metadata { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
          .metadata div { margin-bottom: 4px; }
          .metadata strong { color: #555; }
          .bio { white-space: pre-wrap; font-style: italic; color: #444; background: #fafafa; padding: 12px; border-radius: 6px; border-left: 3px solid #ddd; margin-bottom: 20px; }
          .content-block { background: #fff; word-wrap: break-word; font-family: inherit; font-size: 13.5px; }
          .post-grid { margin-top: 20px; }
          .post-card { border: 1px solid #eee; padding: 12px; border-radius: 6px; margin-bottom: 12px; background: #fcfcfc; page-break-inside: avoid; }
          .post-meta { font-size: 11px; color: #777; margin-bottom: 6px; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Website Content Specification</h1>
        <p style="font-size:12px; color:#666; margin-top:0;">Generated on ${new Date().toLocaleDateString()} via Grám</p>
        
        <div class="metadata">
          <div><strong>Business Name:</strong> ${business.name}</div>
          <div><strong>Instagram Handle:</strong> @${business.handle}</div>
          <div><strong>Category:</strong> ${business.category}</div>
          <div><strong>Followers:</strong> ${business.followers}</div>
          <div><strong>Contact Info:</strong> ${business.contact}</div>
          <div><strong>Address:</strong> ${business.address}</div>
        </div>

        <h2>Biography</h2>
        <div class="bio">${business.bio}</div>

        <h2>1. Homepage Copy & CTA</h2>
        <div class="content-block">${mdToHtml(aiContent.copy || "(Not generated yet)")}</div>

        <h2>2. Services & Offerings</h2>
        <div class="content-block">${mdToHtml(aiContent.services || "(Not generated yet)")}</div>

        <h2>3. Frequently Asked Questions (FAQs)</h2>
        <div class="content-block">${mdToHtml(aiContent.faqs || "(Not generated yet)")}</div>

        <h2>4. SEO Keywords & Meta Copy</h2>
        <div class="content-block">${mdToHtml(aiContent.seo || "(Not generated yet)")}</div>

        <h2>5. Customer Testimonials</h2>
        <div class="content-block">${mdToHtml(aiContent.testimonials || "(Not generated yet)")}</div>

        <h2>6. Google Business Profile (GBP)</h2>
        <div class="content-block">${mdToHtml(aiContent.gbp || "(Not generated yet)")}</div>

        <h2 style="page-break-before: always;">Extracted Instagram Feed Posts</h2>
        <div class="post-grid">
          ${business.posts.map((p, i) => `
            <div class="post-card">
              <div class="post-meta">Post ${i + 1} (${p.date}) · ${p.likes} likes</div>
              <div style="font-size: 12.5px; color: #222;">${p.caption}</div>
            </div>
          `).join("")}
        </div>

        <div class="footer">
          Generated using Grám Intelligence Website Content Builder. All rights reserved.
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  };

  const downloadAll = () => {
    downloadJson();
    setTimeout(() => {
      downloadMarkdown();
    }, 150);
    setTimeout(() => {
      downloadPdf();
    }, 300);
  };

  const handleCopy = () => {
    const text = aiContent[activeAiTab];
    if (text) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedTab(activeAiTab);
      setTimeout(() => setCopiedTab(null), 2000);
    }
  };

  // --- RENDER PARTS ---
  return (
    <div className="bg-canvas text-ink min-h-screen font-body p-6 md:p-12">
      <div className="max-w-[720px] mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-hair-soft pb-6 mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight inline-flex items-center gap-2">
              <span className="text-[#e1306c]">📸</span> Grám Intelligence Workspace
            </h1>
            <p className="text-xs text-ink-muted mt-1">Scrape Instagram business data and generate website content in minutes.</p>
          </div>
          <Link href="/" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-s1 hover:bg-s2 border border-hair text-ink-muted hover:text-ink transition-colors">
            ← Home
          </Link>
        </div>

        {/* PHASE 1: INPUT */}
        {phase === "input" && (
          <div className="space-y-4">
            <div className="bg-s1 border border-hair rounded-2xl p-6">
              <label htmlFor="url-input" className="block text-[11px] font-semibold text-ink-muted tracking-wider uppercase mb-3">
                Instagram profile URL or @handle
              </label>
              <div className="flex gap-2">
                <input
                  id="url-input"
                  type="text"
                  placeholder="https://instagram.com/sugarcraft.ng or @sugarcraft.ng"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-canvas border border-hair-soft rounded-xl px-4 py-2 text-sm text-ink outline-none focus:border-blue/40"
                  onKeyDown={(e) => { if (e.key === "Enter") handleScrapeClick(); }}
                />
                <button
                  onClick={handleScrapeClick}
                  className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Extract
                </button>
              </div>
              <p className="text-[11px] text-ink-muted mt-3.5 inline-flex items-center gap-1">
                🔓 Only works with public business accounts. No login required.
              </p>
            </div>

            {searchHistory.length > 0 && (
              <div className="bg-s1 border border-hair rounded-2xl p-6">
                <h3 className="text-xs font-bold text-ink-muted tracking-wider uppercase mb-3.5">Recent Searches</h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {searchHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setUrl(item.username);
                        setPhase("scraping");
                        setScrapeProgress(0);
                        setScrapeSteps([]);
                        triggerScrape(item.username);
                      }}
                      className="w-full text-left bg-s2 border border-hair-soft rounded-xl p-3 hover:bg-hair hover:border-hair-soft transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-semibold text-ink group-hover:text-blue transition-colors">{item.business_name || item.username}</div>
                        <div className="text-[10px] text-ink-muted mt-0.5">@{item.username} · {item.industry || "General Business"}</div>
                      </div>
                      <div className="text-[10px] text-ink-muted font-medium bg-s1 px-2.5 py-1 rounded-full border border-hair group-hover:text-ink group-hover:bg-s2 transition-colors">
                        Load Spec →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-s1 border border-hair rounded-2xl p-6">
              <h3 className="text-xs font-bold text-ink-muted tracking-wider uppercase mb-4">What gets extracted</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Business name & bio", "Contact details & location", "Recent post captions", "Images and video covers", "Story highlights list", "Follower metrics & stats"].map((feat, idx) => (
                  <div key={idx} className="text-xs text-ink-muted flex items-center gap-2">
                    <span className="text-green text-sm font-bold">✓</span> {feat}
                  </div>
                ))}
              </div>
              <div className="h-px bg-hair-soft my-5" />
              <h3 className="text-xs font-bold text-ink-muted tracking-wider uppercase mb-4">AI content generated</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Homepage copy & CTA", "Service listings & pricing", "Detailed FAQ accordion", "Local SEO tags & titles", "Nigerian-localized testimonials", "GBP local description"].map((feat, idx) => (
                  <div key={idx} className="text-xs text-ink-muted flex items-center gap-2">
                    <span className="text-blue text-sm font-bold">✦</span> {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: SCRAPING */}
        {phase === "scraping" && (
          <div className="bg-s1 border border-hair rounded-2xl p-6">
            <h2 className="text-sm font-bold text-ink-muted tracking-wider uppercase mb-3">Extracting from Instagram</h2>
            <div className="text-xs font-semibold mb-3">{url}</div>
            
            {/* Progress bar */}
            <div className="w-full h-1 bg-s2 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-blue transition-all duration-300" style={{ width: `${scrapeProgress}%` }} />
            </div>
            
            <div className="text-xs text-ink-muted mb-6">{scrapeProgress}% complete</div>
            
            <div className="space-y-2">
              {scrapeSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <div className={`w-1.5 h-1.5 rounded-full ${idx === scrapeSteps.length - 1 && scrapeProgress < 100 ? "bg-blue animate-pulse" : "bg-green"}`} />
                  <span>{step.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHASE 3: RESULTS (DONE) */}
        {phase === "done" && business && (
          <div className="space-y-5">
            
            {/* Business Profile Panel */}
            <div className="bg-s1 border border-hair rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <span className="text-[11px] font-bold text-ink-muted tracking-wider uppercase">Business Profile</span>
                <button
                  onClick={() => { setPhase("input"); setBusiness(null); setAiContent({}); }}
                  className="bg-s2 text-ink border border-hair text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-hair hover:border-hair-soft transition-colors"
                >
                  ↺ New search
                </button>
              </div>

              <div className="flex items-center gap-4 bg-s2 border border-hair-soft rounded-xl p-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue/20 text-blue flex items-center justify-center text-lg font-bold">
                  {business.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{business.name}</h3>
                  <p className="text-xs text-ink-muted">@{business.handle} · {business.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <div className="bg-s2 border border-hair-soft rounded-xl p-3 text-center">
                  <span className="text-md font-bold tracking-tight block">{business.posts_count}</span>
                  <span className="text-[10px] text-ink-muted">Posts</span>
                </div>
                <div className="bg-s2 border border-hair-soft rounded-xl p-3 text-center">
                  <span className="text-md font-bold tracking-tight block">{business.followers}</span>
                  <span className="text-[10px] text-ink-muted">Followers</span>
                </div>
                <div className="bg-s2 border border-hair-soft rounded-xl p-3 text-center">
                  <span className="text-md font-bold tracking-tight block">{business.following}</span>
                  <span className="text-[10px] text-ink-muted">Following</span>
                </div>
              </div>

              <div className="text-xs text-ink leading-relaxed whitespace-pre-wrap bg-s2 border border-hair-soft rounded-xl p-3.5 mb-4">
                {business.bio}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-hair-soft pt-4 mt-2">
                <div>
                  <span className="text-ink-muted block mb-0.5">📞 Contact Info</span>
                  <span className="font-semibold">{business.contact}</span>
                </div>
                <div>
                  <span className="text-ink-muted block mb-0.5">📍 Address</span>
                  <span className="font-semibold">{business.address}</span>
                </div>
              </div>
            </div>

            {/* Highlights Panel */}
            {business.highlights && business.highlights.length > 0 && (
              <div className="bg-s1 border border-hair rounded-2xl p-6">
                <span className="text-[11px] font-bold text-ink-muted tracking-wider uppercase block mb-4">Story Highlights</span>
                <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin">
                  {business.highlights.map((hl, idx) => {
                    const postForHighlight = business.posts[idx % business.posts.length];
                    const coverUrl = postForHighlight?.media_url;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-shrink-0 w-16 text-center">
                        <div className="w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center mb-1.5 shadow-sm">
                          <div className="w-full h-full rounded-full border border-canvas overflow-hidden bg-s2 flex items-center justify-center">
                            {coverUrl ? (
                              <img 
                                src={coverUrl} 
                                alt={hl} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-ink-muted font-medium">{hl.substring(0, 3)}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-ink-muted truncate w-full">{hl}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Posts Grid Panel */}
            <div className="bg-s1 border border-hair rounded-2xl p-6">
              <span className="text-[11px] font-bold text-ink-muted tracking-wider uppercase block mb-4">Collected Posts ({business.posts.length})</span>
              <div className="grid grid-cols-3 gap-3">
                {business.posts.map((post, idx) => (
                  <div key={idx} className="aspect-square rounded-xl bg-s2 border border-hair-soft flex items-center justify-center relative overflow-hidden group shadow-sm transition-all duration-300 hover:shadow-md hover:border-hair">
                    {post.media_url ? (
                      <img 
                        src={post.media_url} 
                        alt={post.caption || "Instagram Post"} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-[10px] text-ink-muted line-clamp-4 leading-normal p-2.5">{post.caption}</span>
                    )}
                    {/* Hover Caption Overlay */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 text-center backdrop-blur-[2px]">
                      <p className="text-[10px] text-white line-clamp-4 leading-normal font-medium">{post.caption || "No caption"}</p>
                    </div>
                  </div>
                ))}
              </div>

              <details className="mt-4 group">
                <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink list-none flex items-center gap-1 select-none">
                  <span className="group-open:rotate-90 transition-transform">▶</span> View full bakes captions
                </summary>
                <div className="mt-4 space-y-3">
                  {business.posts.map((post, idx) => (
                    <div key={idx} className="bg-s2 border border-hair-soft rounded-xl p-3.5 text-xs flex gap-4 items-start">
                      {post.media_url && (
                        <img 
                          src={post.media_url} 
                          alt="Thumbnail" 
                          className="w-14 h-14 rounded-lg object-cover border border-hair flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="text-[10px] text-ink-muted mb-1.5 font-medium">{post.date} · ♥ {post.likes} likes</div>
                        <p className="leading-relaxed">{post.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            {/* AI Generator Panel */}
            <div className="bg-s1 border border-hair rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-hair-soft pb-4 mb-4">
                <span className="text-[11px] font-bold text-ink-muted tracking-wider uppercase">AI-Generated Website Content</span>
                <span className="text-[11px] font-semibold text-blue bg-blue/10 px-2 py-0.5 rounded-full">Claude v3.5</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
                {AI_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border border-transparent transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                      activeAiTab === tab.id ? "bg-white text-black font-bold" : "bg-s2 text-ink-muted hover:bg-hair"
                    }`}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>

              {/* AI Content Output */}
              <div className="bg-s2 border border-hair-soft rounded-xl p-4.5 min-h-[160px] text-xs leading-relaxed relative mb-4">
                {loadingAi ? (
                  <div className="text-ink-muted italic flex items-center gap-2">
                    <span className="animate-spin inline-block">⏳</span> Generating content details...
                  </div>
                ) : generationError ? (
                  <div className="text-red-400 font-semibold py-4 text-center">
                    ❌ Error: {generationError}
                  </div>
                ) : aiContent[activeAiTab] ? (
                  <div 
                    className="text-ink text-[13px] leading-normal space-y-1.5"
                    dangerouslySetInnerHTML={{ __html: mdToHtml(aiContent[activeAiTab]) }}
                  />
                ) : (
                  <div className="text-ink-muted text-center py-6">Click a tab to generate AI copy.</div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hair-soft mt-4">
                <button
                  onClick={handleCopy}
                  disabled={!aiContent[activeAiTab]}
                  className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {copiedTab === activeAiTab ? "✓ Copied" : "📋 Copy section"}
                </button>
                
                <div className="relative group">
                  <button
                    disabled={loadingAi}
                    className="bg-s2 text-ink border border-hair hover:bg-hair hover:border-hair-soft text-xs font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingAi ? "⏳ Generating Copy..." : "📥 Export Formats"}
                  </button>
                  {!loadingAi && (
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-s2 border border-hair rounded-xl shadow-xl p-1.5 min-w-[170px] z-50">
                      <button
                        onClick={exportToSheets}
                        className="w-full text-left text-xs text-ink-muted hover:text-ink px-3 py-2 hover:bg-hair rounded-lg transition-colors flex items-center gap-2"
                      >
                        📊 Excel / CSV
                      </button>
                      <button
                        onClick={downloadImagesZip}
                        disabled={downloadingZip}
                        className="w-full text-left text-xs text-ink-muted hover:text-ink px-3 py-2 hover:bg-hair rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {downloadingZip ? "⚡ Packaging Zip..." : "🗂️ Images Pack (.zip)"}
                      </button>
                      <button
                        onClick={downloadJson}
                        className="w-full text-left text-xs text-ink-muted hover:text-ink px-3 py-2 hover:bg-hair rounded-lg transition-colors flex items-center gap-2"
                      >
                        📄 JSON Payload
                      </button>
                      <button
                        onClick={downloadMarkdown}
                        className="w-full text-left text-xs text-ink-muted hover:text-ink px-3 py-2 hover:bg-hair rounded-lg transition-colors flex items-center gap-2"
                      >
                        📝 Markdown (.md)
                      </button>
                      <button
                        onClick={downloadPdf}
                        className="w-full text-left text-xs text-ink-muted hover:text-ink px-3 py-2 hover:bg-hair rounded-lg transition-colors flex items-center gap-2"
                      >
                        🖼️ PDF Spec Sheet
                      </button>
                      <div className="h-px bg-hair-soft my-1" />
                      <button
                        onClick={downloadAll}
                        className="w-full text-left text-xs text-blue hover:text-blue-600 px-3 py-2 hover:bg-hair rounded-lg transition-colors flex items-center gap-2 font-semibold"
                      >
                        📦 All Content (.pdf, .md, .json)
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => generateAll()}
                  className="bg-blue text-white font-semibold text-xs px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors ml-auto"
                >
                  🚀 Generate all copy
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="bg-canvas text-ink min-h-screen flex items-center justify-center font-body text-xs italic">
        Loading workspace dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
