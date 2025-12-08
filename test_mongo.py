# test_mongo.py
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env from the backend folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "backend", ".env"))

async def main():
    mongo_url = os.getenv("mongodb+srv://atlrishitjindal:Topand%40123@cluster0.9frzdl7.mongodb.net/Cluster0?retryWrites=true&w=majority")
    db_name = os.getenv("Cluster0")

    if not mongo_url or not db_name:
        print("ERROR: MONGO_URL or DB_NAME not set")
        return

    try:
        client = AsyncIOMotorClient(mongo_url)
        await client.admin.command("ping")
        print("SUCCESS: Connected to MongoDB!")
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"Database '{db_name}' collections: {collections}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())