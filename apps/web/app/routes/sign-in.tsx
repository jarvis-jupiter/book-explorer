import { SignIn } from "@clerk/remix";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
