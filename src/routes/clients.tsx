import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for everything under /clients. The list lives in
// clients.index.tsx and the 360 view in clients.$id.tsx; both render here
// through <Outlet />. Without this Outlet, /clients/$id would render the list
// (its parent) instead of the detail page.
export const Route = createFileRoute("/clients")({
  component: () => <Outlet />,
});
