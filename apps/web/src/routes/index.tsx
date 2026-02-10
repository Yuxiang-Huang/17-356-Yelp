import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, signOut, useSession } from "@/lib/auth/client.ts";
import { $api } from "@/lib/api/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data: auth } = useSession();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const {
    data: businesses,
    isLoading,
    isError,
    error,
  } = $api.useQuery("get", "/businesses", {
    params: {
      query: {
        search: search || undefined,
        city: city || undefined,
        category: category || undefined,
        page: 1,
        pageSize: 20,
      },
    },
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        {auth?.user ? (
          <div className="text-sm">
            Signed in as{" "}
            <span className="font-semibold">{auth.user.givenName}</span>{" "}
            <Button
              size="sm"
              variant="ghost"
              onClick={signOut}
              className="ml-2"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="text-sm">
            You are browsing as a guest.{" "}
            <Button size="sm" className="inline" onClick={() => signIn()}>
              Sign In to review
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="border rounded px-3 py-2 w-full md:col-span-2"
          placeholder="Search by name, category, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Category (e.g. Cafe, Restaurant)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      {isLoading && <div>Loading nearby places...</div>}
      {isError && (
        <div className="text-red-600">
          Error loading businesses: {String(error)}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {businesses?.items?.map((biz) => (
          <Card
            key={biz.id}
            className="p-4 flex flex-col justify-between hover:shadow-lg transition-shadow"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{biz.name}</h2>
              <div className="text-sm text-gray-600">
                {biz.category} • {biz.city}, {biz.state}
              </div>
              <div className="text-xs text-gray-500">{biz.address}</div>
              {biz.description ? (
                <p className="mt-1 text-sm text-gray-700 line-clamp-3">
                  {biz.description}
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold">
                  {biz.averageRating.toFixed(1)}
                </span>{" "}
                <span className="text-yellow-500">★</span>{" "}
                <span className="text-gray-600">
                  ({biz.reviewCount} review{biz.reviewCount === 1 ? "" : "s"})
                </span>
              </div>
              <Link
                to="/businesses/$id"
                params={{ id: biz.id }}
                className="text-blue-600 hover:underline text-sm"
              >
                View details
              </Link>
            </div>
          </Card>
        ))}
        {!isLoading && businesses?.items?.length === 0 && (
          <div>No places match your search yet.</div>
        )}
      </div>
    </div>
  );
}
