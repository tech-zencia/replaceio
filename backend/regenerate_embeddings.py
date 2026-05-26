"""
Run once after the SQL migration to re-generate all property embeddings
using Voyage AI (1024-dim) to replace the old Gemini (768-dim) embeddings.

Usage (from /backend directory):
    python regenerate_embeddings.py
"""

import os
import time
import voyageai
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]
VOYAGE_EMBED_MODEL = os.environ.get("VOYAGE_EMBED_MODEL", "voyage-2")

client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
voyage = voyageai.Client(api_key=VOYAGE_API_KEY)


def property_to_text(p: dict) -> str:
    def fmt_price(price):
        if price >= 10_000_000:
            return f"{price / 10_000_000:.1f} Cr"
        if price >= 100_000:
            return f"{price / 100_000:.1f} L"
        return str(int(price))

    parts = [
        p.get("title", ""),
        p.get("property_type", ""),
        f"{p.get('bedrooms')} BHK" if p.get("bedrooms") else "",
        p.get("listing_type", ""),
        p.get("locality", ""),
        p.get("city", ""),
        f"₹{fmt_price(p.get('price', 0))}",
        f"{p.get('area_sqft')} sqft" if p.get("area_sqft") else "",
        p.get("furnishing_status", ""),
        " ".join(p.get("amenities") or []),
        p.get("description", ""),
    ]
    return " ".join(x for x in parts if x)


def main():
    print("Fetching all properties...")
    result = client.table("properties").select(
        "id,title,property_type,listing_type,price,city,locality,"
        "bedrooms,area_sqft,furnishing_status,amenities,description"
    ).execute()

    properties = result.data or []
    total = len(properties)
    print(f"Found {total} properties to embed.\n")

    success = 0
    failed = 0

    for i, prop in enumerate(properties, 1):
        prop_id = prop["id"]
        text = property_to_text(prop)

        try:
            result = voyage.embed([text], model=VOYAGE_EMBED_MODEL, input_type="document")
            embedding = result.embeddings[0]

            client.table("properties").update(
                {"embedding": embedding}
            ).eq("id", prop_id).execute()

            success += 1
            print(f"[{i}/{total}] ✓ {prop.get('title', prop_id)[:60]}")

        except Exception as e:
            failed += 1
            print(f"[{i}/{total}] ✗ {prop_id} — {e}")

        # Voyage free tier: 100 RPM — small delay to stay safe
        if i % 10 == 0:
            time.sleep(1)

    print(f"\nDone. {success} succeeded, {failed} failed.")


if __name__ == "__main__":
    main()
