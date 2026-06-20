import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PROMPTS: Record<string, (biz: any, captionsSummary: string) => string> = {
  copy: (biz, captions) => `You are a professional Nigerian web copywriter. Based on this business info, write compelling homepage copy.

Business: ${biz.name}
Category: ${biz.category || "Local Business"}
Bio: ${biz.bio || ""}
Location: ${biz.address || "Nigeria"}
Contact: ${biz.contact || ""}
Recent post captions:
${captions}

Write:
1. HERO HEADLINE (powerful, 8-12 words)
2. HERO SUBHEADLINE (one sentence, benefit-focused)
3. ABOUT US PARAGRAPH (3-4 sentences, warm and professional)
4. CALL TO ACTION TEXT (2 options)

Keep it concise, Nigerian context-appropriate, and conversion-focused.`,

  services: (biz, captions) => `Based on this Instagram business's posts and bio, extract and structure their service offerings.

Business: ${biz.name} (${biz.category || "Local Business"})
Bio: ${biz.bio || ""}
Posts: ${captions}

Write a SERVICES PAGE with:
- 4-6 distinct services/products
- Each with: Name, Short description (1-2 sentences), Starting price if mentioned

Format clearly with section headers.`,

  faqs: (biz, captions) => `Generate 6-8 realistic FAQs for this business's website based on their Instagram content.

Business: ${biz.name}
Bio: ${biz.bio || ""}
Posts: ${captions}

Write natural Q&A pairs covering: ordering, delivery, pricing, customization, lead times, payment. Nigerian context. Make answers helpful and specific.`,

  seo: (biz, captions) => `Generate SEO keywords and metadata for this business's website.

Business: ${biz.name} (${biz.category || "Local Business"})
Location: ${biz.address || "Nigeria"}
Bio: ${biz.bio || ""}

Provide:
1. PRIMARY KEYWORDS (5) — high-intent search terms
2. LONG-TAIL KEYWORDS (8) — specific search phrases
3. LOCAL SEO KEYWORDS (5) — location-based terms
4. META TITLE (under 60 chars)
5. META DESCRIPTION (under 155 chars)
6. H1 TAG suggestion`,

  testimonials: (biz, captions) => `Create 4 realistic customer testimonial sections for this business's website based on their Instagram post themes.

Business: ${biz.name}
Posts suggest: ${captions.slice(0, 500)}

Write 4 testimonials with:
- Nigerian customer names
- Star rating (4-5 stars)
- 2-3 sentence quote about their experience
- Service type used

Make them authentic, specific, and believable.`,

  gbp: (biz, captions) => `Write a complete Google Business Profile description for this business.

Business: ${biz.name}
Category: ${biz.category || "Local Business"}
Bio: ${biz.bio || ""}
Address: ${biz.address || ""}
Contact: ${biz.contact || ""}

Write:
1. PRIMARY DESCRIPTION (250 words max, keyword-rich, includes services, location, what makes them special)
2. 5 SERVICES to list on GBP
3. 3 POSTS ideas for Google Business updates

Optimized for local search in Nigeria.`
};

export async function POST(request: Request) {
  try {
    const { business, tabId } = await request.json();

    if (!business || !tabId) {
      return NextResponse.json({ error: "Missing required fields 'business' or 'tabId'" }, { status: 400 });
    }

    const username = business.handle.toLowerCase();

    // 1. Check if the business exists in our DB
    const dbBusiness = await prisma.business.findUnique({
      where: { username }
    });

    if (dbBusiness) {
      // Check cache for this specific content type
      const cachedContent = await prisma.generatedContent.findFirst({
        where: {
          business_id: dbBusiness.id,
          type: tabId
        }
      });
      if (cachedContent) {
        return NextResponse.json({ text: cachedContent.content, cached: true });
      }
    }

    const captionsSummary = business.posts
      ? business.posts.map((p: any, i: number) => `${i + 1}. ${p.caption}`).join("\n")
      : "";

    const prompt = PROMPTS[tabId]?.(business, captionsSummary) || `Generate content details for ${business.name}`;

    let text = "";

    // 2. Call Nvidia, OpenAI, or Anthropic API if key is present
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const nvidiaModel = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (nvidiaKey) {
      try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nvidiaKey}`
          },
          body: JSON.stringify({
            model: nvidiaModel,
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }]
          })
        });

        if (response.ok) {
          const resData = await response.json();
          text = resData.choices?.[0]?.message?.content || "";
        } else {
          console.error("Nvidia NIM API error response:", await response.text());
        }
      } catch (err) {
        console.error("Nvidia NIM API failed:", err);
      }
    }

    if (anthropicKey && !text) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }]
          })
        });

        if (response.ok) {
          const resData = await response.json();
          text = resData.content?.find((b: any) => b.type === "text")?.text || "";
        }
      } catch (err) {
        console.error("Anthropic API failed:", err);
      }
    } else if (openaiKey && !text) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }]
          })
        });

        if (response.ok) {
          const resData = await response.json();
          text = resData.choices?.[0]?.message?.content || "";
        }
      } catch (err) {
        console.error("OpenAI API failed:", err);
      }
    }

    // 3. Fallback Content Generation if API keys are missing or requests failed
    if (!text) {
      // Return structured fallback strings
      if (tabId === "copy") {
        text = `=== HERO HEADLINE ===
Elevating celebrations for ${business.name} with premium custom designs!

=== HERO SUBHEADLINE ===
${business.name} designs breathtaking custom bakes and setups crafted to celebrate your life's best memories in Lagos and Abuja.

=== ABOUT US PARAGRAPH ===
At ${business.name}, we believe every milestone deserves a delicious highlight. Starting from our local studio, we handcraft custom cakes, cupcakes, and event bakes using quality ingredients. We deliver across major city zones, ensuring your orders arrive safe and fresh.

=== CALL TO ACTION TEXT ===
1. "Book Your Custom Order"
2. "Talk to Our Lead Decorator"`;
      } else if (tabId === "services") {
        text = `=== CUSTOM WEDDING CAKES ===
Multi-layered elegant cakes styled to match your event theme. Fondant detailing, gold foil accents, and handcrafted flowers.
Starting Price: ₦180,000

=== CELEBRATION BIRTHDAY CAKES ===
Fun themed designs, custom shape structures, and buttercream finishes.
Starting Price: ₦50,000

=== CLASSIC RED VELVET CUPCAKES ===
Fluffy red velvet sponge topped with our signature cream cheese frosting. Box of 12 or 24.
Starting Price: ₦9,000`;
      } else if (tabId === "faqs") {
        text = `Q: Do you offer same-day delivery?
A: Same-day delivery is available for box cupcakes and select classic cakes if ordered before 10 AM. Custom event designs require at least 5-7 days notice.

Q: How do I book an order?
A: You can book an order by sending us a WhatsApp message at ${business.contact || "our line"} or via Instagram DM. A 50% deposit is required to confirm your booking.

Q: Do you cater for corporate retreats?
A: Yes! We provide custom bulk catering and branded cupcakes for corporate events, banks, and office milestones.`;
      } else if (tabId === "seo") {
        text = `=== PRIMARY KEYWORDS ===
1. Custom cakes ${business.name}
2. Best bakers in Lekki Lagos
3. Wedding cake bakers Abuja
4. Cupcake delivery near me
5. Event catering cake studio

=== META TITLE ===
${business.name} | Luxury Custom Cakes & Event Bakery

=== META DESCRIPTION ===
Bespoke custom cakes, cupcakes, and cheesecakes handcrafted in Nigeria. Same-day delivery and priority custom catering available.`;
      } else if (tabId === "testimonials") {
        text = `=== TOLUWALOPE A. ===
⭐⭐⭐⭐⭐
"We ordered the red velvet cupcakes and the cake platter. Excellent taste and prompt delivery!"
- Custom Cupcake Client

=== EMMANUEL O. ===
⭐⭐⭐⭐⭐
"Amazing detail on the custom corporate cake. The entire team loved the sponge. Will order again!"
- Corporate Client`;
      } else if (tabId === "gbp") {
        text = `=== PRIMARY DESCRIPTION ===
${business.name} is a leading custom bakery and cake studio in Nigeria. We specialize in luxury multi-tiered wedding cakes, celebration birthday bakes, and cupcakes. We prioritize taste and presentation to make your milestones memorable.

=== GBP SERVICES TO LIST ===
1. Custom Wedding Cakes
2. Buttercream Anniversary Cakes
3. Branded Corporate Cakes
4. Party Cupcake Platter Delivery
5. Traditional Celebration Bakes`;
      } else {
        text = `Custom generated content for ${business.name}.`;
      }
    }

    // 4. Save to database if business exists
    if (dbBusiness) {
      await prisma.generatedContent.create({
        data: {
          business_id: dbBusiness.id,
          type: tabId,
          content: text
        }
      });
    }

    return NextResponse.json({ text, cached: false });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
