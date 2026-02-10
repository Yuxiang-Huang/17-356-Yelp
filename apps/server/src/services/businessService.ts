export interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  description?: string;
  averageRating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateReviewInput {
  businessId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
}

// Simple in-memory data store for demo purposes.
// In a production Yelp clone, this would be backed by a database.
const businesses: Business[] = [
  {
    id: "1",
    name: "Scotty Coffee Roasters",
    category: "Cafe",
    city: "Pittsburgh",
    state: "PA",
    address: "123 Campus Ave",
    description: "Cozy campus coffee shop with great pour-overs and study space.",
    averageRating: 4.7,
    reviewCount: 3,
  },
  {
    id: "2",
    name: "Panther Pizza",
    category: "Restaurant",
    city: "Pittsburgh",
    state: "PA",
    address: "456 Panther Way",
    description: "Late-night pizza spot popular with students.",
    averageRating: 4.2,
    reviewCount: 5,
  },
  {
    id: "3",
    name: "Yinz Bites Food Truck",
    category: "Food Truck",
    city: "Pittsburgh",
    state: "PA",
    address: "Various locations",
    description: "Rotating menu of Pittsburgh-inspired comfort food.",
    averageRating: 4.5,
    reviewCount: 2,
  },
];

const reviews: Review[] = [
  {
    id: "r1",
    businessId: "1",
    userId: "demo-user",
    userName: "Demo User",
    rating: 5,
    comment: "Amazing coffee and friendly staff!",
    createdAt: new Date().toISOString(),
  },
  {
    id: "r2",
    businessId: "2",
    userId: "demo-user",
    userName: "Demo User",
    rating: 4,
    comment: "Great slices, perfect after hackathons.",
    createdAt: new Date().toISOString(),
  },
];

function generateId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function recomputeRatings(businessId: string) {
  const biz = businesses.find((b) => b.id === businessId);
  if (!biz) return;

  const bizReviews = reviews.filter((r) => r.businessId === businessId);
  if (bizReviews.length === 0) {
    biz.averageRating = 0;
    biz.reviewCount = 0;
    return;
  }

  const total = bizReviews.reduce((sum, r) => sum + r.rating, 0);
  biz.averageRating = Number((total / bizReviews.length).toFixed(2));
  biz.reviewCount = bizReviews.length;
}

export const businessService = {
  listBusinesses(options: {
    search?: string;
    category?: string;
    city?: string;
    page?: number;
    pageSize?: number;
  }): PaginatedResult<Business> {
    const { search, category, city, page = 1, pageSize = 10 } = options;

    let filtered = [...businesses];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          (b.description?.toLowerCase().includes(q) ?? false),
      );
    }

    if (category) {
      const c = category.toLowerCase();
      filtered = filtered.filter((b) => b.category.toLowerCase() === c);
    }

    if (city) {
      const c = city.toLowerCase();
      filtered = filtered.filter((b) => b.city.toLowerCase() === c);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: filtered.slice(start, end),
      total,
      page,
      pageSize,
    };
  },

  getBusiness(id: string): Business | undefined {
    return businesses.find((b) => b.id === id);
  },

  listReviews(businessId: string): Review[] {
    return reviews
      .filter((r) => r.businessId === businessId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  createReview(input: CreateReviewInput): Review {
    const biz = businesses.find((b) => b.id === input.businessId);
    if (!biz) {
      throw new Error("Business not found");
    }

    const review: Review = {
      id: generateId("rev"),
      businessId: input.businessId,
      userId: input.userId,
      userName: input.userName,
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString(),
    };

    reviews.push(review);
    recomputeRatings(input.businessId);

    return review;
  },
};

