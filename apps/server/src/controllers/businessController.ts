import type { Request as ExpressRequest } from "express";
import {
  Body,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import {
  ADMIN_SCOPE,
  BEARER_AUTH,
  MEMBER_SCOPE,
  OIDC_AUTH,
} from "../lib/authentication.ts";
import {
  businessService,
  type Business,
  type PaginatedResult,
  type Review,
} from "../services/businessService.ts";

export interface ListBusinessesResponse extends PaginatedResult<Business> {}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

@Route("businesses")
@Tags("Businesses")
export class BusinessController {
  /**
   * List businesses with optional search and filters.
   */
  @Get("/")
  @SuccessResponse(200)
  public async listBusinesses(
    @Query() search?: string,
    @Query() category?: string,
    @Query() city?: string,
    @Query() page = 1,
    @Query() pageSize = 10,
  ): Promise<ListBusinessesResponse> {
    return businessService.listBusinesses({
      search,
      category,
      city,
      page,
      pageSize,
    });
  }

  /**
   * Get detailed information for a single business.
   */
  @Get("{id}")
  @SuccessResponse(200)
  public async getBusiness(
    @Path() id: string,
  ): Promise<Business | undefined> {
    return businessService.getBusiness(id);
  }

  /**
   * List reviews for a business.
   */
  @Get("{id}/reviews")
  @SuccessResponse(200)
  public async listReviews(@Path() id: string): Promise<Review[]> {
    return businessService.listReviews(id);
  }

  /**
   * Create a review for a business.
   * Requires authentication; both OIDC and Bearer JWT are supported.
   */
  @Security(OIDC_AUTH, [MEMBER_SCOPE, ADMIN_SCOPE])
  @Security(BEARER_AUTH, [MEMBER_SCOPE, ADMIN_SCOPE])
  @Post("{id}/reviews")
  @SuccessResponse(201)
  public async createReview(
    @Path() id: string,
    @Body() body: CreateReviewRequest,
    @Request() req: ExpressRequest,
  ): Promise<Review> {
    const user = req.user as Express.User | undefined;

    if (!user?.sub) {
      throw new Error("Authenticated user not found on request");
    }

    if (body.rating < 1 || body.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    return businessService.createReview({
      businessId: id,
      userId: user.sub,
      userName: user.givenName ?? user.email,
      rating: body.rating,
      comment: body.comment,
    });
  }
}

