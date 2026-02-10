import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { $api } from "@/lib/api/client.ts";
import { useSession } from "@/lib/auth/client.ts";

export const Route = createFileRoute("/businesses/$id")({
  component: BusinessPage,
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      $api.queryOptions("get", "/businesses/{id}", {
        params: { path: { id: params.id } },
      }),
    );
  },
  pendingComponent: () => <div>Loading...</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
});

function BusinessPage() {
  const { id } = Route.useParams();
  const { data: auth } = useSession();

  const { data: business } = $api.useSuspenseQuery("get", "/businesses/{id}", {
    params: { path: { id } },
  });

  const {
    data: reviews,
    isLoading: isLoadingReviews,
    isError: isErrorReviews,
    refetch: refetchReviews,
  } = $api.useQuery("get", "/businesses/{id}/reviews", {
    params: { path: { id } },
  });

  const createReview = $api.useMutation("post", "/businesses/{id}/reviews");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    try {
      await createReview.mutateAsync({
        params: { path: { id } },
        body: { rating, comment },
      });
      setComment("");
      setRating(5);
      await refetchReviews();
    } catch (err) {
      console.error(err);
      setSubmitError("Unable to submit review. Are you signed in?");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4 space-y-2">
        <h2 className="text-2xl font-semibold">{business.name}</h2>
        <div className="text-sm text-gray-600">
          {business.category} • {business.city}, {business.state}
        </div>
        <div className="text-xs text-gray-500">{business.address}</div>
        {business.description && (
          <p className="mt-2 text-sm text-gray-700">{business.description}</p>
        )}
        <div className="mt-2 text-sm">
          <span className="font-semibold text-lg">
            {business.averageRating.toFixed(1)}
          </span>{" "}
          <span className="text-yellow-500">★</span>{" "}
          <span className="text-gray-600">
            ({business.reviewCount} review
            {business.reviewCount === 1 ? "" : "s"})
          </span>
        </div>
      </Card>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Reviews</h3>
        {isLoadingReviews && <div>Loading reviews...</div>}
        {isErrorReviews && (
          <div className="text-red-600">Unable to load reviews.</div>
        )}
        <div className="space-y-3">
          {reviews?.map((review) => (
            <Card key={review.id} className="p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-yellow-600">
                    {review.rating} ★
                  </span>
                  {review.userName && (
                    <span className="ml-2 text-gray-700">
                      by {review.userName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {review.comment}
              </p>
            </Card>
          ))}
          {!isLoadingReviews && reviews && reviews.length === 0 && (
            <div className="text-sm text-gray-600">
              No reviews yet. Be the first to review!
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Add your review</h3>
        {!auth?.user && (
          <div className="text-sm text-gray-700">
            You need to sign in to post a review.
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-3 max-w-md"
          aria-disabled={!auth?.user}
        >
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" htmlFor="rating">
              Rating
            </label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="border rounded px-2 py-1"
              disabled={!auth?.user}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} - {r === 5 ? "Excellent" : r === 1 ? "Terrible" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <textarea
              className="border rounded px-3 py-2 w-full min-h-[100px]"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!auth?.user}
            />
          </div>
          {submitError && (
            <div className="text-sm text-red-600">{submitError}</div>
          )}
          <Button
            type="submit"
            disabled={!auth?.user || createReview.isPending}
          >
            {createReview.isPending ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      </section>
    </div>
  );
}
