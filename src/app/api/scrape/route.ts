import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

// Helper to clean and extract username from input URL or handle
function extractUsername(input: string): string {
  let cleaned = input.trim();
  // Remove leading @
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.substring(1);
  }
  // Extract from URLs
  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const urlObj = new URL(cleaned);
      if (urlObj.hostname.includes("instagram.com")) {
        const paths = urlObj.pathname.split("/").filter(Boolean);
        if (paths.length > 0) {
          cleaned = paths[0];
        }
      }
    }
  } catch (e) {
    // Ignore URL parse errors, fall back to cleaned string
  }
  return cleaned.toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing 'url' search parameter" }, { status: 400 });
  }

  const username = extractUsername(rawUrl);
  if (!username) {
    return NextResponse.json({ error: "Invalid Instagram username" }, { status: 400 });
  }

  try {
    // 1. Check database cache first
    const cachedBusiness = await prisma.business.findUnique({
      where: { username },
      include: { posts: true, services: true }
    });

    if (cachedBusiness) {
      // Return cached results to save API tokens
      return NextResponse.json({
        cached: true,
        business: {
          handle: cachedBusiness.username,
          name: cachedBusiness.business_name,
          bio: cachedBusiness.bio || "",
          followers: cachedBusiness.followers || "0",
          following: cachedBusiness.following || "0",
          posts_count: cachedBusiness.posts_count || "0",
          contact: cachedBusiness.phone || cachedBusiness.email || "Contact via DM",
          address: cachedBusiness.address || "Nigeria",
          website: cachedBusiness.website || "",
          category: cachedBusiness.industry || "General Business",
          highlights: ["About Us", "Services", "Client Reviews"],
          posts: cachedBusiness.posts.map((p: any) => ({
            caption: p.caption || "",
            likes: p.likes,
            date: p.posted_at.toISOString().split("T")[0],
            media_url: p.media_url || "",
            media_type: p.media_type || "image"
          }))
        }
      });
    }

    // 2. Fetch using Apify Instagram Scraper API (Primary)
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN is not configured on the server. Please check your environment variables." },
        { status: 401 }
      );
    }

    try {
      const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}`;
      const response = await fetch(apifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${username}/`],
          resultsType: "posts",
          resultsLimit: 6,
          addParentData: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Apify Scraper API failed: ${response.statusText} (${response.status}) - ${errorText}` },
          { status: response.status }
        );
      }

      const items = await response.json();
      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: "No data returned from Instagram. Please make sure the profile is public and spelling is correct." },
          { status: 404 }
        );
      }

      const firstItem = items[0];
      const owner = firstItem.owner || firstItem;

      if (!owner || (!owner.id && !owner.username && !owner.followersCount)) {
        return NextResponse.json(
          { error: "Instagram profile not found or is private. Please make sure the account is public and spelled correctly." },
          { status: 404 }
        );
      }

      const name = owner.fullName || owner.username || username;
      const bio = owner.biography || "";
      const followers = String(owner.followersCount || "0");
      const following = String(owner.followsCount || "0");
      const posts_count = String(owner.postsCount || "0");
      const website = owner.externalUrl || "";
      
      // Extract contact
      const email = owner.biographyEmail || null;
      const phone = owner.biographyPhone || null;
      const contact = phone || email || "Contact via DM";
      
      // Extract posts and process images through R2 or fallback to local storage
      const postsData = await Promise.all(items.map(async (item: any, i: number) => {
        const rawMediaUrl = item.displayUrl || "";
        let mediaUrl = rawMediaUrl;

        if (rawMediaUrl) {
          try {
            const imgRes = await fetch(rawMediaUrl);
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              const extension = contentType.split("/")[1] || "jpg";
              const filename = `${username}_post_${i + 1}_${Date.now()}.${extension}`;

              const isR2Configured = !!(
                process.env.R2_ACCOUNT_ID &&
                process.env.R2_ACCESS_KEY_ID &&
                process.env.R2_SECRET_ACCESS_KEY
              );

              let uploadedToR2 = false;

              if (isR2Configured) {
                try {
                  const { uploadToR2 } = await import("@/lib/r2");
                  mediaUrl = await uploadToR2(filename, buffer, contentType);
                  uploadedToR2 = true;
                  console.log(`Successfully uploaded image ${i + 1} to R2: ${mediaUrl}`);
                } catch (r2Err) {
                  console.error(`R2 upload failed for image ${i + 1}, falling back to local storage:`, r2Err);
                }
              }

              // Save to local storage if R2 was not configured or R2 upload failed
              if (!uploadedToR2) {
                const uploadDir = path.join(process.cwd(), "public", "uploads");
                await fs.mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);
                await fs.writeFile(filePath, buffer);
                mediaUrl = `/uploads/${filename}`;
                console.log(`Saved image ${i + 1} to local storage fallback: ${mediaUrl}`);
              }
            }
          } catch (err) {
            console.error(`Failed to process image ${i + 1}:`, err);
          }
        }

        return {
          caption: item.caption || "",
          likes: item.likesCount || 0,
          comments: item.commentsCount || 0,
          media_type: item.type || "image",
          media_url: mediaUrl
        };
      }));

      // Upsert Business in database
      const businessDb = await prisma.business.upsert({
        where: { username },
        update: {
          business_name: name,
          bio,
          followers,
          following,
          website,
          email,
          phone,
          posts_count
        },
        create: {
          instagram_url: `https://instagram.com/${username}`,
          username,
          business_name: name,
          bio,
          followers,
          following,
          website,
          email,
          phone,
          posts_count
        }
      });

      // Create posts in database
      await prisma.post.deleteMany({ where: { business_id: businessDb.id } });
      await prisma.post.createMany({
        data: postsData.map((p: any) => ({
          business_id: businessDb.id,
          caption: p.caption,
          likes: p.likes,
          comments: p.comments,
          media_type: p.media_type,
          media_url: p.media_url
        }))
      });

      return NextResponse.json({
        cached: false,
        business: {
          handle: username,
          name,
          bio,
          followers,
          following,
          posts_count,
          contact,
          address: "Nigeria",
          website,
          category: "Local Business",
          highlights: ["Services", "Reviews", "FAQ"],
          posts: postsData.map((p: any) => ({
            caption: p.caption,
            likes: p.likes,
            date: new Date().toISOString().split("T")[0],
            media_url: p.media_url,
            media_type: p.media_type
          }))
        }
      });

    } catch (apifyErr: any) {
      console.error("Apify scraping failed:", apifyErr);
      return NextResponse.json(
        { error: `Instagram scraping failed: ${apifyErr.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
