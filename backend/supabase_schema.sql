-- Enable pgvector
create extension if not exists vector;

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text,
  phone text,
  role text not null default 'user' check (role in ('user', 'agent', 'builder')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Properties table
create table public.properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  property_type text not null check (property_type in ('flat','house','villa','plot','commercial','pg')),
  listing_type text not null check (listing_type in ('sale','rent')),
  status text not null default 'active' check (status in ('active','inactive','sold','rented')),
  address text,
  city text not null,
  locality text,
  pincode text,
  latitude double precision,
  longitude double precision,
  price double precision not null,
  area_sqft double precision,
  bedrooms int,
  bathrooms int,
  floor_number int,
  furnishing_status text check (furnishing_status in ('furnished','semi_furnished','unfurnished')),
  possession_status text check (possession_status in ('ready_to_move','under_construction')),
  property_age_years int,
  amenities jsonb default '[]',
  source text default 'platform',
  source_url text,
  embedding vector(768),
  views int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Property media
create table public.property_media (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade,
  url text not null,
  media_type text default 'image' check (media_type in ('image','video')),
  created_at timestamptz default now()
);

-- Search history
create table public.search_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  query text not null,
  filters jsonb,
  result_count int,
  created_at timestamptz default now()
);

-- Saved properties
create table public.saved_properties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, property_id)
);

-- Property views (for view count tracking)
create table public.property_views (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  viewed_at timestamptz default now()
);

-- Indexes
create index on public.properties (city);
create index on public.properties (listing_type);
create index on public.properties (property_type);
create index on public.properties (status);
create index on public.properties using hnsw (embedding vector_cosine_ops);

-- Vector search function
create or replace function search_properties(
  query_embedding vector(768),
  match_count int default 20,
  offset_val int default 0,
  filter_city text default null,
  filter_property_type text default null,
  filter_listing_type text default null,
  filter_bedrooms int default null,
  filter_min_price double precision default null,
  filter_max_price double precision default null
)
returns table (
  id uuid, title text, description text, property_type text, listing_type text,
  status text, address text, city text, locality text, pincode text,
  latitude double precision, longitude double precision,
  price double precision, area_sqft double precision,
  bedrooms int, bathrooms int, floor_number int,
  furnishing_status text, possession_status text, property_age_years int,
  amenities jsonb, source text, source_url text, owner_id uuid,
  created_at timestamptz, similarity float
)
language sql stable as $$
  select
    p.id, p.title, p.description, p.property_type, p.listing_type,
    p.status, p.address, p.city, p.locality, p.pincode,
    p.latitude, p.longitude, p.price, p.area_sqft,
    p.bedrooms, p.bathrooms, p.floor_number,
    p.furnishing_status, p.possession_status, p.property_age_years,
    p.amenities, p.source, p.source_url, p.owner_id,
    p.created_at,
    1 - (p.embedding <=> query_embedding) as similarity
  from properties p
  where
    p.status = 'active'
    and p.embedding is not null
    and (filter_city is null or lower(p.city) = lower(filter_city))
    and (filter_property_type is null or p.property_type = filter_property_type)
    and (filter_listing_type is null or p.listing_type = filter_listing_type)
    and (filter_bedrooms is null or p.bedrooms = filter_bedrooms)
    and (filter_min_price is null or p.price >= filter_min_price)
    and (filter_max_price is null or p.price <= filter_max_price)
  order by p.embedding <=> query_embedding
  limit match_count
  offset offset_val;
$$;

-- Row Level Security
alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.search_history enable row level security;
alter table public.saved_properties enable row level security;
alter table public.property_views enable row level security;

-- RLS Policies: users
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Service role can insert users" on public.users for insert with check (true);

-- RLS Policies: properties
create policy "Anyone can view active properties" on public.properties for select using (status = 'active' or auth.uid() = owner_id);
create policy "Authenticated users can insert properties" on public.properties for insert with check (auth.uid() = owner_id);
create policy "Owners can update their properties" on public.properties for update using (auth.uid() = owner_id);
create policy "Owners can delete their properties" on public.properties for delete using (auth.uid() = owner_id);

-- RLS Policies: property_media
create policy "Anyone can view media" on public.property_media for select using (true);
create policy "Property owners can insert media" on public.property_media for insert with check (
  exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
);

-- RLS Policies: saved_properties
create policy "Users see own saved" on public.saved_properties for select using (auth.uid() = user_id);
create policy "Users can save properties" on public.saved_properties for insert with check (auth.uid() = user_id);
create policy "Users can unsave" on public.saved_properties for delete using (auth.uid() = user_id);

-- RLS Policies: search_history
create policy "Users see own history" on public.search_history for select using (auth.uid() = user_id);
create policy "Users can insert history" on public.search_history for insert with check (auth.uid() = user_id);

-- RLS Policies: property_views
create policy "Anyone can track views" on public.property_views for insert with check (true);
create policy "Anyone can read views" on public.property_views for select using (true);
