# 🏠 Real Estate Platform — Step-by-Step Build Guide
**Stack: React + FastAPI + Supabase + Gemini AI**

---

## 📋 Overview

| Phase | What You Build | Duration |
|---|---|---|
| Phase 1 | Planning & Setup | Week 1 |
| Phase 2 | Supabase — Database & Auth | Week 1–2 |
| Phase 3 | FastAPI — Backend & APIs | Week 2–3 |
| Phase 4 | Gemini AI — Search Intelligence | Week 3–4 |
| Phase 5 | RapidAPI Listing Search | Week 4–5 |
| Phase 6 | React — Frontend & UI | Week 5–7 |
| Phase 7 | Testing & Bug Fixes | Week 7–8 |
| Phase 8 | Deployment & Launch | Week 8 |

---

## Phase 1 — Planning & Setup

### Step 1 — Define Your MVP Scope
- Decide which city to launch in first (e.g. Lucknow only)
- Decide which property types to support first (e.g. Flat only)
- List the 5 most important features for launch
- Write down what a buyer journey looks like (search → view → contact)
- Write down what a seller journey looks like (register → post → get leads)

### Step 2 — Create All Accounts
- Create a **Supabase** account at supabase.com
- Create a **Google AI Studio** account at ai.google.dev to get Gemini API key
- Create a **Vercel** account at vercel.com (for frontend hosting)
- Create a **Railway** account at railway.app (for backend hosting)
- Create an **Upstash** account at upstash.com (for free Redis)
- Create a **GitHub** account if you don't have one (for code storage)

### Step 3 — Install Tools on Your Computer
- Install **Node.js** (version 18 or above) from nodejs.org
- Install **Python** (version 3.11 or above) from python.org
- Install **VS Code** as your code editor from code.visualstudio.com
- Install **Git** from git-scm.com
- Install **Postman** from postman.com (for testing APIs)

### Step 4 — Setup Project Folder
- Create a main project folder called `real-estate-platform`
- Inside it create two folders: `frontend` and `backend`
- Initialize a Git repository in the main folder
- Create a `.gitignore` file to exclude secret files and dependencies
- Push the empty project to GitHub

### Step 5 — Plan Your Folder Structure
- Plan what pages you need in React (Home, Search, Property Detail, Post Property, Dashboard, Login)
- Plan what API endpoints you need in FastAPI (auth, properties, search, users)
- Plan what database tables you need (users, properties, property media, search history, saved properties)
- Draw a rough diagram of how all parts connect to each other

---

## Phase 2 — Supabase Setup (Database & Auth)

### Step 1 — Create a New Supabase Project
- Log in to supabase.com
- Click "New Project"
- Give it a name (e.g. real-estate-platform)
- Choose a strong database password and save it
- Select the Mumbai region for best performance in India
- Wait 2–3 minutes for the project to be ready

### Step 2 — Enable Vector Search
- Go to the SQL Editor in your Supabase dashboard
- Enable the `pgvector` extension which allows AI-powered vector search
- This lets Supabase store and search AI embeddings directly in the database
- Verify it was enabled successfully

### Step 3 — Create the Users Table
- Create a `users` table that stores user profiles
- Fields to include: id, name, phone number, role (user/agent/builder), profile photo URL, created date
- Link this table to Supabase's built-in authentication system
- Keep a single user type — role field decides what they can do

### Step 4 — Create the Properties Table
- Create a `properties` table — this is your main table
- Basic info fields: title, description, property type, listing type (sale/rent), status
- Location fields: full address, city, locality, pincode, latitude, longitude
- Property detail fields: price, area in sqft, bedrooms, bathrooms, floor number, furnishing status, possession status, property age in years
- Amenities field: store as a flexible JSON list (parking, lift, gym, pool etc.)
- Source fields: where the data came from (own platform, MagicBricks, 99acres), original URL
- AI field: a vector column (768 dimensions) to store Gemini embeddings for each property
- Add created date and updated date fields

### Step 5 — Create Supporting Tables
- Create a `property_media` table to store image and video URLs linked to each property
- Create a `search_history` table to save what users searched for (used for personalization later)
- Create a `saved_properties` table for users to shortlist properties they like

### Step 6 — Create the Vector Search Function
- Write a database function called `search_properties` inside Supabase
- This function takes a search vector (numbers) as input
- It compares that vector against all stored property vectors
- It also accepts optional filters like city, price range, bedrooms, property type
- It returns the most similar properties ranked by closeness to the search query
- This is the core of your AI search feature

### Step 7 — Set Up Row Level Security (RLS)
- Enable RLS on all tables so users can only access the right data
- Rule: anyone can view active properties
- Rule: only the property owner can edit or delete their own listing
- Rule: users can only see their own search history and saved properties
- Test each rule to make sure it works correctly

### Step 8 — Setup Supabase Storage
- Go to the Storage section in Supabase
- Create one bucket called `property-media` and make it public
- Inside that bucket, use an `images/` folder for property photos and a `videos/` folder for property videos
- Set file size limits (e.g. max 5MB per image)
- This is where all property photos and videos will be stored

### Step 9 — Get Your API Keys
- Go to Supabase Project Settings → API
- Copy the Project URL
- Copy the `anon` public key (used in React frontend)
- Copy the `service_role` secret key (used in FastAPI backend — keep this private)
- Save all three in a secure note

---

## Phase 3 — FastAPI Backend

### Step 1 — Initialize the Backend Project
- Go into your `backend` folder
- Create a Python virtual environment to isolate dependencies
- Activate the virtual environment
- Install all required Python packages: FastAPI, Uvicorn, Supabase client, Google Generative AI, Playwright, Redis, APScheduler, python-dotenv, Pydantic
- Create a `requirements.txt` file listing all installed packages

### Step 2 — Create Environment Variables File
- Create a `.env` file inside the backend folder
- Add your Supabase URL and both API keys
- Add your Gemini API key
- Add your Redis connection URL
- Add a secret key for JWT token signing
- Never commit this file to GitHub — add it to `.gitignore`

### Step 3 — Plan Your API Routes
- `/api/auth/register` — create new user account
- `/api/auth/login` — login and get access token
- `/api/properties` (POST) — create a new property listing
- `/api/properties/:id` (GET) — get one property's full details
- `/api/properties/user/:userId` (GET) — get all properties by a specific user
- `/api/properties/:id` (PUT) — edit a property
- `/api/properties/:id` (DELETE) — delete a property
- `/api/properties/:id/media` (POST) — upload images for a property
- `/api/search` (POST) — main AI-powered search endpoint
- `/api/users/profile` (GET) — get logged-in user's profile
- `/api/users/saved` (GET/POST) — manage saved properties

### Step 4 — Build the Auth System
- The register endpoint should: accept name, email, phone, password → create user in Supabase Auth → save extra details (name, phone) to your users table → return success message
- The login endpoint should: accept email and password → verify with Supabase Auth → return an access token that the frontend will use for all future requests
- Add a middleware function that reads the token from request headers and identifies the current user
- Protect all private routes with this middleware

### Step 5 — Build the Properties Endpoints
- The create property endpoint should: accept all property details → save to the properties table → automatically trigger embedding generation in the background → return the created property
- The get property endpoint should: fetch property details → also fetch related media (images/videos) → also fetch seller contact info → return everything together
- The upload media endpoint should: accept image files → upload them to Supabase Storage → save the public URLs to the property_media table → return the URLs
- The edit and delete endpoints should: first verify the requesting user owns the property → then perform the action

### Step 6 — Build the Search Endpoint
- The search endpoint is the most important one
- It should accept: the user's text query, optional page number, optional limit
- Inside it should: call Gemini to parse the query into filters, generate a query embedding, call the Supabase vector search function, fetch images for results, generate an AI summary, save to search history, cache the result in Redis, return everything
- This endpoint will be called every time a user searches

### Step 7 — Setup Redis Caching
- Connect to your Upstash Redis instance
- Create a helper function to read from cache
- Create a helper function to write to cache with an expiry time
- Use these in the search endpoint — cache results for 1 hour
- This prevents calling Gemini API repeatedly for the same search query and saves cost

### Step 8 — Test All Endpoints with Postman
- Open Postman and create a new collection for your API
- Test register and login — make sure you get a token back
- Test creating a property — verify it appears in Supabase
- Test the search endpoint with different queries
- Test image upload
- Fix any errors before moving forward

---

## Phase 4 — Gemini AI Integration

### Step 1 — Get Your Gemini API Key
- Go to ai.google.dev
- Sign in with your Google account
- Click "Get API Key" and create a new key
- Copy the key and add it to your backend `.env` file
- Understand the free tier limits (requests per minute, per day)

### Step 2 — Understand Which Gemini Models to Use
- Use `gemini-2.0-flash-lite` for text tasks like parsing queries and generating summaries — it is fast and cheap
- Use `embedding-001` for generating vector embeddings — this converts text into numbers that represent meaning
- There are two types of embeddings: `retrieval_document` (used when saving a property) and `retrieval_query` (used when a user searches) — use the correct type for each

### Step 3 — Build the Embedding Generator
- Create a service file for generating embeddings
- When a new property is saved: combine its title, type, location, price, and amenities into one text description → send to Gemini embedding model → receive back 768 numbers → save those numbers in the property's vector column in Supabase
- When a user searches: take their query text → send to Gemini embedding model (query type) → receive back 768 numbers → use these to search against all stored property vectors

### Step 4 — Build the Query Parser
- Create a function that takes a user's raw search text (e.g. "2BHK flat in Lucknow under 50 lakhs near school")
- Send it to Gemini with a prompt that instructs it to extract structured filters
- Gemini returns structured data: city = Lucknow, bedrooms = 2, max price = 5000000, amenities = [school nearby]
- Handle price conversion in the prompt (50 lakhs = 5000000, 1 crore = 10000000)
- Handle cases where the user does not mention some filters (return null for those)
- Parse Gemini's response and return a clean filters object

### Step 5 — Build the AI Summary Generator
- Create a function that takes the top 3 search results and the original user query
- Send them to Gemini with a prompt asking for a 2-line helpful summary
- For example: "Found 3 great 2BHK options in Gomti Nagar. The listing by Raj Properties offers the best value at ₹45 lakhs with parking included."
- Return this summary to be shown at the top of search results
- This makes the platform feel intelligent and helpful

### Step 6 — Connect AI to the Search Flow
- Make sure embedding generation happens automatically when any platform property is saved
- Make sure the query parser runs first on every search before calling RapidAPI
- Make sure the AI summary runs after results are fetched
- Test the full flow: type a natural language query → see correctly parsed filters → see relevant results → see AI summary

---

## Phase 5 — RapidAPI Listing Search

### Step 1 — Understand What Data You Need
- Use a RapidAPI real estate provider for live listings instead of scraping websites
- Data to normalize per property: title, price, location, area, bedrooms, property type, contact info, images, source URL
- Keep platform-posted listings in Supabase and external listings as RapidAPI-backed search results

### Step 2 — Configure RapidAPI
- Subscribe to a real estate API on RapidAPI
- Add `RAPIDAPI_KEY` to the backend `.env`
- Configure `RAPIDAPI_HOST`, `RAPIDAPI_BASE_URL`, and endpoint paths if you use a provider other than the default
- Test the provider directly with a known city/state or ZIP code

### Step 3 — Build the Search Adapter
- Convert parsed filters into the provider's request payload
- Send requests with `X-RapidAPI-Key` and `X-RapidAPI-Host`
- Normalize provider responses into the app's property card fields
- Return images, price, area, location, external IDs, and source metadata

### Step 4 — Build the Detail Adapter
- Encode provider property IDs in search results
- When a user opens an external result, fetch its detail from RapidAPI
- Normalize detail responses into the same property-detail shape used by Supabase listings

### Step 5 — Test the Flow End-to-End
- Search using natural language with city/state or ZIP
- Verify filters are parsed correctly
- Verify RapidAPI results render in search cards
- Open a result and verify the detail page loads photos, map, specs, and contact details

---

## Phase 6 — React Frontend

### Step 1 — Initialize the React Project
- Go into your `frontend` folder
- Create a new React app using Vite (faster than Create React App)
- Install required packages: React Router (for navigation), Axios (for API calls), Supabase JS client, Tailwind CSS (for styling), React Query (for data fetching), Zustand (for state management), React Hot Toast (for notifications)
- Set up Tailwind CSS properly
- Create your `.env` file with Supabase URL, anon key, and your FastAPI backend URL

### Step 2 — Setup Routing
- Install and configure React Router
- Define all your page routes: `/` for Home, `/search` for Search Results, `/property/:id` for Property Detail, `/post-property` for listing form, `/dashboard` for user dashboard, `/login` and `/register` for authentication
- Create a layout component with a Navbar that appears on all pages
- Add protected routes — pages like Post Property and Dashboard should redirect to login if user is not logged in

### Step 3 — Build the Authentication Pages
- Login page: email and password fields → call FastAPI login endpoint → save token → redirect to home
- Register page: name, email, phone, password fields → call FastAPI register endpoint → redirect to login
- Create an auth state using Zustand that stores the current user and token across the whole app
- Add a logout button in the Navbar that clears the auth state
- On app load, check if a saved token exists and auto-login the user

### Step 4 — Build the Home Page
- Large hero section with a search bar in the center
- Search bar: one big text input with a "Search AI" button
- Add 3–4 example search suggestion buttons below the bar (clickable, they fill the search bar)
- Featured cities section below
- Brief "How it works" section (3 steps: Search → View → Contact)
- Call to action for agents to post for free

### Step 5 — Build the AI Search Bar Component
- This component is used on both the Home page and the Search Results page
- It should: accept a text query → on pressing Enter or clicking button → redirect to `/search?q=your+query`
- Show a loading spinner while results are being fetched
- Keep the search bar pre-filled on the results page with the current query

### Step 6 — Build the Search Results Page
- Read the query from the URL parameters
- On page load, call the FastAPI search endpoint with the query
- Show a loading skeleton (grey placeholder cards) while waiting for results
- At the top, show the AI summary from Gemini in a highlighted box
- Below the summary, show detected filters as small tags (e.g. "Lucknow", "2 BHK", "Under ₹50L")
- Show total results count
- Show properties in a grid (3 columns on desktop, 1 column on mobile)
- Each result shows: match percentage badge, photo, title, price, location, BHK and area details, View button
- Show "No results found" message if empty

### Step 7 — Build the Property Card Component
- Used in search results and potentially on the home page
- Show: first property image (or a placeholder if no image), match score badge in top corner, property title, price formatted correctly (show in Lakhs or Crores), locality and city, BHK count, area in sqft, property type, a View Details button

### Step 8 — Build the Property Detail Page
- Full page view of a single property
- Image gallery at the top (show all photos, clickable)
- Price prominently displayed
- All property details in a clear layout: location, size, BHK, bathrooms, floor, age, furnishing, possession
- Amenities shown as icon tags
- Property description section
- Seller contact section: show seller name, phone number, WhatsApp button
- Map showing property location (use Google Maps embed or Leaflet)
- "Save Property" button for logged-in users

### Step 9 — Build the Post Property Form
- Multi-section form (can be one page or multi-step)
- Section 1 — Basic Info: title, property type dropdown, listing type (sale/rent) dropdown
- Section 2 — Location: city, locality, full address, pincode
- Section 3 — Property Details: price, area, bedrooms, bathrooms, floor number, furnishing status, possession status
- Section 4 — Amenities: grid of toggleable amenity buttons (Parking, Lift, Gym, Pool, etc.)
- Section 5 — Photos: drag and drop image uploader, show preview of selected images
- Section 6 — Description: text area for additional details
- Submit button with loading state
- On success: show confirmation and redirect to the user's dashboard

### Step 10 — Build the User Dashboard
- Show logged-in user's name and profile info at top
- Two tabs: "My Listings" (seller view) and "Saved Properties" (buyer view)
- My Listings tab: show all properties the user has posted with edit and delete buttons, status (active/inactive), number of views
- Saved Properties tab: show all properties the user has shortlisted with a remove button
- Edit Profile section: update name, phone, profile photo

---

## Phase 7 — Testing & Bug Fixes

### Step 1 — Test Every User Journey
- Complete buyer journey: open site → search for a property → view results → open property detail → save property → check saved in dashboard
- Complete seller journey: register → login → post a property → upload photos → view it in dashboard → edit it → delete it
- Test on desktop and mobile screen sizes
- Test with slow internet connection

### Step 2 — Test AI Search Quality
- Search for properties using natural language queries
- Verify that Gemini correctly extracts city, price, bedrooms from queries
- Verify that vector search returns relevant results
- Test edge cases: very vague queries, queries with typos, queries in Hinglish
- Adjust your Gemini prompts if results are poor

### Step 3 — Test RapidAPI Search
- Search with a known city/state or ZIP code
- Verify normalized RapidAPI data looks correct in the UI
- Open an external result and confirm the detail API loads
- Verify Redis caching is working for repeated searches

### Step 4 — Performance Testing
- Check how fast the search endpoint responds (should be under 2 seconds)
- Check if Redis caching is working (second search for same query should be faster)
- Check image loading speed
- Optimize any slow database queries by adding indexes in Supabase

### Step 5 — Security Checks
- Make sure `.env` files are not in your GitHub repository
- Make sure the `service_role` Supabase key is only used in the backend, never in React
- Make sure users cannot edit or delete properties they do not own
- Make sure file upload only accepts images (not .exe or .pdf)

### Step 6 — Fix All Known Bugs
- List every bug found during testing
- Fix them one by one
- Re-test after each fix
- Get someone else to test the platform fresh (they will find things you missed)

---

## Phase 8 — Deployment & Launch

### Step 1 — Deploy the Database (Already Live)
- Supabase is already in the cloud — nothing to deploy
- Just make sure all tables, functions, and RLS policies are correctly set up in production
- Take a note of your production Supabase URL and keys

### Step 2 — Deploy Redis on Upstash
- Log in to upstash.com
- Create a new Redis database (free tier is enough to start)
- Copy the Redis connection URL
- This will be used by your FastAPI backend for caching

### Step 3 — Deploy the FastAPI Backend on Railway
- Push your backend code to GitHub
- Log in to railway.app
- Create a new project and connect your GitHub repository
- Select the backend folder
- Railway will auto-detect it is a Python/FastAPI project
- Set all environment variables (Supabase URL, Gemini key, Redis URL etc.) in the Railway dashboard
- Railway will build and deploy automatically
- Copy the generated backend URL (e.g. https://your-app.railway.app)

### Step 4 — Deploy the React Frontend on Vercel
- Push your frontend code to GitHub
- Log in to vercel.com
- Create a new project and connect your GitHub repository
- Select the frontend folder
- Set environment variables: Supabase URL, Supabase anon key, and your Railway backend URL as `VITE_API_URL`
- Vercel will build and deploy automatically
- You will get a live URL (e.g. https://your-app.vercel.app)

### Step 5 — Connect a Custom Domain (Optional)
- Buy a domain name (e.g. yourplatform.in) from GoDaddy or Namecheap
- In Vercel settings, add your custom domain
- Update the DNS records at your domain registrar as instructed by Vercel
- Wait 24 hours for DNS to propagate
- Your site will be live at your custom domain

### Step 6 — Setup Monitoring
- Enable Supabase logs to monitor database queries and errors
- Enable Railway logs to monitor backend errors
- Add Vercel Analytics to track frontend traffic
- Set up a simple uptime monitor (use UptimeRobot — free) to alert you if the site goes down

### Step 7 — Soft Launch
- Invite 10 real estate agents from your target city to post their properties
- Help them personally if needed — make the onboarding smooth
- Get at least 50–100 property listings before opening to public buyers
- Ask agents for feedback on the posting experience

### Step 8 — Public Launch
- Share the platform on local Facebook/WhatsApp real estate groups
- Post on Instagram and LinkedIn targeting your city's real estate community
- Ask early users to share feedback
- Monitor search queries to understand what users are looking for
- Iterate and improve based on real usage

---

## 📅 Full Timeline Summary

| Week | What to Complete |
|---|---|
| Week 1 | Planning, account setup, tools installed, Supabase database ready |
| Week 2 | FastAPI backend with auth and property APIs working |
| Week 3 | Gemini AI integrated, embeddings generating, query parser working |
| Week 4 | Full search endpoint working end-to-end with AI and caching |
| Week 5 | Scrapers built and running, data pipeline tested |
| Week 6 | React frontend — Home, Search, Property Detail pages ready |
| Week 7 | Post Property form, Dashboard, Auth pages ready, full testing done |
| Week 8 | Deployed to production, 50+ listings added, soft launch |

---

## 💰 Cost Summary

| Service | Free Tier | When to Upgrade |
|---|---|---|
| Supabase | 500MB DB, 1GB storage | When DB exceeds 500MB |
| Gemini API | Generous free tier | When traffic grows |
| Upstash Redis | 10,000 requests/day | When search volume grows |
| Vercel | Free for hobby projects | When you need custom domains + team features |
| Railway | $5/month (~₹420) | Needed from day 1 for backend |

**Estimated starting cost: ₹400–500/month**

---

## 🚀 Launch Checklist

- All database tables created with correct columns and relationships
- Vector search function working and tested
- Auth (register and login) working
- Property posting working with image upload
- AI search returning relevant results
- Scraper collecting data from at least one external platform
- All pages built and mobile-responsive
- Site deployed and accessible via a public URL
- At least 50 properties in the database
- Tested by at least 3 real users before public launch

---

> **Golden Rule:** Launch with one city, one property type, and make the search experience excellent. Expand only after the core works perfectly.
