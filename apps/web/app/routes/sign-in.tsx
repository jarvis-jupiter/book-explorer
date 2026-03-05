import { SignIn } from "@clerk/remix";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get("redirect_url") ?? "/";
  return json({ redirectUrl });
}

export default function SignInPage() {
  const { redirectUrl } = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <SignIn routing="path" path="/sign-in" forceRedirectUrl={redirectUrl} />
    </div>
  );
}
