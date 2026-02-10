import { db } from "./client.ts";
import { businesses } from "./schema.ts";
import { businessService } from "../services/businessService.ts";

async function main() {
  console.log("Seeding database with sample businesses and reviews...");

  // Clear existing data (dev only)
  await db.delete(businesses);

  const seedBusinesses = [
    {
      id: "scotty-coffee-roasters",
      name: "Scotty Coffee Roasters",
      category: "Cafe",
      city: "Pittsburgh",
      state: "PA",
      address: "123 Campus Ave",
      description:
        "Cozy campus coffee shop with great pour-overs, study space, and late hours.",
    },
    {
      id: "panther-pizza",
      name: "Panther Pizza",
      category: "Restaurant",
      city: "Pittsburgh",
      state: "PA",
      address: "456 Panther Way",
      description: "Classic New York–style slices, open late after hackathons.",
    },
    {
      id: "yinz-bites-food-truck",
      name: "Yinz Bites Food Truck",
      category: "Food Truck",
      city: "Pittsburgh",
      state: "PA",
      address: "Rotating campus locations",
      description:
        "Pittsburgh-inspired comfort food on wheels, usually near CS buildings.",
    },
  ];

  await db.insert(businesses).values(
    seedBusinesses.map((b) => ({
      ...b,
      averageRating: 0,
      reviewCount: 0,
    })),
  );

  // Seed some example reviews via the service so ratings aggregate correctly
  const reviews = [
    {
      businessId: "scotty-coffee-roasters",
      userId: "demo-user-1",
      userName: "Ada Lovelace",
      rating: 5,
      comment: "Best espresso on campus, lots of outlets and quiet corners.",
    },
    {
      businessId: "scotty-coffee-roasters",
      userId: "demo-user-2",
      userName: "Alan Turing",
      rating: 4,
      comment: "Great vibes, sometimes crowded during midterms.",
    },
    {
      businessId: "panther-pizza",
      userId: "demo-user-3",
      userName: "Grace Hopper",
      rating: 5,
      comment: "Perfect post-hackathon fuel. Garlic knots are elite.",
    },
    {
      businessId: "panther-pizza",
      userId: "demo-user-4",
      userName: "Donald Knuth",
      rating: 3,
      comment: "Good, but the line gets long on Friday nights.",
    },
    {
      businessId: "yinz-bites-food-truck",
      userId: "demo-user-5",
      userName: "Katherine Johnson",
      rating: 4,
      comment: "Creative menu, surprisingly fast service between classes.",
    },
  ];

  for (const review of reviews) {
    await businessService.createReview(review);
  }

  console.log("Seeding complete.");
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});

