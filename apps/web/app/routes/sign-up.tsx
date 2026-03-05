import { SignUp } from "@clerk/remix";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
