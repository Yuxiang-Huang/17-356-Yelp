import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/client.ts";
import { businesses, reviews } from "../db/schema.ts";

export interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  description?: string | null;
  averageRating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName?: string | null;
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
  userName?: string | null;
  rating: number;
  comment: string;
}

function generateId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

async function recomputeRatings(businessId: string) {
  const [agg] = await db
    .select({
      average: sql<number>`avg(${reviews.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.businessId, businessId));

  // Drizzle + Postgres often return numeric aggregates as strings,
  // so we coerce to numbers explicitly.
  const hasRows = agg && agg.count !== null && agg.count !== undefined;
  const reviewCount = hasRows ? Number(agg.count) : 0;

  const averageRating = hasRows
    ? Number(Number(agg.average ?? 0).toFixed(2))
    : 0;

  await db
    .update(businesses)
    .set({ averageRating: averageRating.toString(), reviewCount })
    .where(eq(businesses.id, businessId));
}

export const businessService = {
  async listBusinesses(options: {
    search?: string;
    category?: string;
    city?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<Business>> {
    const { search, category, city, page = 1, pageSize = 10 } = options;

    const conditions = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(businesses.name, pattern),
          ilike(businesses.category, pattern),
          ilike(businesses.city, pattern),
          ilike(businesses.description, pattern),
        ),
      );
    }

    if (category) {
      conditions.push(ilike(businesses.category, category));
    }

    if (city) {
      conditions.push(ilike(businesses.city, city));
    }

    const where =
      conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        category: businesses.category,
        city: businesses.city,
        state: businesses.state,
        address: businesses.address,
        description: businesses.description,
        averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        reviewCount: sql<number>`count(${reviews.id})`,
      })
      .from(businesses)
      .leftJoin(reviews, eq(businesses.id, reviews.businessId))
      .where(where)
      .groupBy(
        businesses.id,
        businesses.name,
        businesses.category,
        businesses.city,
        businesses.state,
        businesses.address,
        businesses.description,
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [{ value: totalRaw } = { value: 0 }] = await db
      .select({
        value: sql<number>`count(*)`,
      })
      .from(businesses)
      .where(where);

    return {
      items: rows.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        city: b.city,
        state: b.state,
        address: b.address,
        description: b.description,
        averageRating: Number(Number(b.averageRating ?? 0).toFixed(2)),
        reviewCount: Number(b.reviewCount ?? 0),
      })),
      total: Number(totalRaw),
      page,
      pageSize,
    };
  },

  async getBusiness(id: string): Promise<Business | undefined> {
    const [b] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        category: businesses.category,
        city: businesses.city,
        state: businesses.state,
        address: businesses.address,
        description: businesses.description,
        averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        reviewCount: sql<number>`count(${reviews.id})`,
      })
      .from(businesses)
      .leftJoin(reviews, eq(businesses.id, reviews.businessId))
      .where(eq(businesses.id, id))
      .groupBy(
        businesses.id,
        businesses.name,
        businesses.category,
        businesses.city,
        businesses.state,
        businesses.address,
        businesses.description,
      )
      .limit(1);

    if (!b) return undefined;

    return {
      id: b.id,
      name: b.name,
      category: b.category,
      city: b.city,
      state: b.state,
      address: b.address,
      description: b.description,
      averageRating: Number(Number(b.averageRating ?? 0).toFixed(2)),
      reviewCount: Number(b.reviewCount ?? 0),
    };
  },

  async listReviews(businessId: string): Promise<Review[]> {
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.businessId, businessId))
      .orderBy(desc(reviews.createdAt));

    return rows.map((r) => ({
      id: r.id,
      businessId: r.businessId,
      userId: r.userId,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async createReview(input: CreateReviewInput): Promise<Review> {
    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, input.businessId))
      .limit(1);

    if (!biz) {
      throw new Error("Business not found");
    }

    const reviewId = generateId("rev");

    const [inserted] = await db
      .insert(reviews)
      .values({
        id: reviewId,
        businessId: input.businessId,
        userId: input.userId,
        userName: input.userName ?? null,
        rating: input.rating,
        comment: input.comment,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to create review");
    }

    await recomputeRatings(input.businessId);

    return {
      id: inserted.id,
      businessId: inserted.businessId,
      userId: inserted.userId,
      userName: inserted.userName,
      rating: inserted.rating,
      comment: inserted.comment,
      createdAt: inserted.createdAt.toISOString(),
    };
  },
};

