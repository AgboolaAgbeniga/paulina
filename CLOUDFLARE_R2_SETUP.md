# Setting up Cloudflare R2 Image Storage

This guide explains how to set up Cloudflare R2 for persistent image storage in the Paulina website generator app.

---

## Step 1: Create a Cloudflare Account
1. Go to [Cloudflare](https://dash.cloudflare.com/sign-up) and sign up or sign in.
2. Go to **Storage & Databases** > **R2 Object Storage** from the left-hand navigation menu.
3. If you haven't enabled R2 before, you may be asked to input a payment method (Cloudflare R2 has a generous free tier of **10 GB/month** storage and millions of free operations, so you likely won't be charged).

---

## Step 2: Create an R2 Bucket
1. Click **Create Bucket**.
2. Name your bucket (e.g., `gram-media`). 
   *(Note: This bucket name is what you will write in your `.env` as `R2_BUCKET_NAME`)*.
3. Choose the **Automatic** region location (or choose a region closest to your server location, such as Western Europe).
4. Click **Create bucket**.

---

## Step 3: Get your Cloudflare Account ID
1. Navigate to the main **R2** dashboard page.
2. Look at the right sidebar for the **Account ID** box.
3. Copy the string (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`).
   *(Note: This is your `R2_ACCOUNT_ID`)*.

---

## Step 4: Generate API Access Keys
1. On the R2 dashboard page, click on **Manage R2 API Tokens** (found in the top right section).
2. Click **Create API Token**.
3. Name your token (e.g., `paulina-app-token`).
4. Under **Permissions**, select **Admin Read & Write** (this allows the app to upload files to R2).
5. Set TTL (Time to Live) to **Forever** (or a duration that fits your security policy).
6. Click **Create API Token**.
7. Copy the following credentials immediately (they will only show up once):
   * **Access Key ID** (e.g., `6a12b34c56d78e...`) — *This is your `R2_ACCESS_KEY_ID`*
   * **Secret Access Key** (e.g., `9f8e7d6c5b4a...`) — *This is your `R2_SECRET_ACCESS_KEY`*

---

## Step 5: Enable Public Access for Images
Since the images uploaded to R2 need to be viewed publicly on the generated websites, you must enable public access:
1. Inside your R2 dashboard, click on your bucket (`gram-media`).
2. Go to the **Settings** tab.
3. Look for the following sections on the page:
   * **Option A (Recommended, Free Custom Domain):** Scroll to the **Custom Domains** section. If you own a domain connected to Cloudflare (e.g., `myapp.com`), click **Connect Domain** (or **Add**) and set up a subdomain (e.g., `media.myapp.com`).
   * **Option B (Temporary R2 Dev URL):** Scroll to the **Public Development URL** section. Click **Enable** and type `allow` to verify. This will generate a public URL (e.g., `pub-12345.r2.dev`).
4. Copy this URL (e.g., `https://media.myapp.com` or `https://pub-12345.r2.dev`).
   *(Note: This is your `R2_PUBLIC_URL`)*.

---

## Step 6: Update your `.env` file
Add these variables to your `.env` file in the `paulina` directory:

```env
# Cloudflare R2 Config
R2_ACCOUNT_ID="your_cloudflare_account_id_here"
R2_ACCESS_KEY_ID="your_access_key_id_here"
R2_SECRET_ACCESS_KEY="your_secret_access_key_here"
R2_BUCKET_NAME="gram-media"
R2_PUBLIC_URL="https://your-public-subdomain.r2.dev"
```

Once added, restart your Next.js server (`npm run dev`). When you run a scrape, the app will automatically download Instagram images and upload them directly to R2!
