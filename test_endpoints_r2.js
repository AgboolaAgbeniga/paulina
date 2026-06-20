/* eslint-disable */
// Using global fetch available in Node.js 18+
const Database = require("better-sqlite3");
const path = require("path");

async function testR2() {
  console.log("=== STARTING REAL CLOUDFLARE R2 INTEGRATION TEST ===");

  const targetHandle = "paulina_bakes";
  const baseUrl = "http://localhost:3001";
  
  console.log("Clearing database cache for 'paulina_bakes' using better-sqlite3...");
  try {
    const dbPath = path.join(__dirname, "prisma", "dev.db");
    const db = new Database(dbPath);
    
    // Delete the business record. Cascade deletes will clean up the associated posts.
    const result = db.prepare("DELETE FROM Business WHERE username = ?").run(targetHandle);
    console.log(`Cache cleared. Rows affected: ${result.changes}`);
    db.close();
  } catch (err) {
    console.error("Failed to clear SQLite cache:", err.message);
  }

  console.log(`\n1. Calling Scrape API for: ${targetHandle}`);
  
  try {
    const scrapeRes = await fetch(`${baseUrl}/api/scrape?url=${targetHandle}`);
    
    if (!scrapeRes.ok) {
      const errBody = await scrapeRes.json().catch(() => ({}));
      throw new Error(`Scrape API failed: ${scrapeRes.statusText} (${scrapeRes.status}). Details: ${JSON.stringify(errBody)}`);
    }
    
    const scrapeData = await scrapeRes.json();
    console.log("Scrape response received successfully.");
    console.log("Business name:", scrapeData.business?.name);
    console.log("Cached state:", scrapeData.cached);
    
    const posts = scrapeData.business?.posts || [];
    console.log(`Number of posts scraped: ${posts.length}`);
    
    if (posts.length > 0) {
      console.log("\n=== POST IMAGES DETAILS ===");
      posts.forEach((post, i) => {
        console.log(`Post ${i + 1}:`);
        console.log(`  - Caption excerpt: "${post.caption.substring(0, 50)}..."`);
        console.log(`  - Media URL: ${post.media_url}`);
      });
      
      const firstPostUrl = posts[0].media_url;
      if (firstPostUrl && (firstPostUrl.includes("r2.cloudflarestorage.com") || firstPostUrl.includes("r2.dev"))) {
        console.log("\n✅ SUCCESS: Image was successfully uploaded to Cloudflare R2!");
        console.log(`R2 URL: ${firstPostUrl}`);
      } else if (firstPostUrl && firstPostUrl.startsWith("/uploads/")) {
        console.log("\n⚠️ LOCAL FALLBACK: Image was successfully saved to local public uploads folder!");
        console.log(`Local URL: ${firstPostUrl}`);
      } else {
        console.log("\n❌ WARNING: Image URL is still pointing directly to Instagram/FB CDN. R2 upload and local fallback both failed.");
        console.log(`Actual URL: ${firstPostUrl}`);
      }
    } else {
      console.log("\n❌ No posts found to test images.");
    }

  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

testR2();
