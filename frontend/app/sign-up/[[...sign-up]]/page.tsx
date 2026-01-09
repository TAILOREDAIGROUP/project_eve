import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Get Started with EVE</h1>
          <p className="text-slate-400">Create your account to begin</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-800 border border-slate-700",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700",
              formFieldInput: "bg-slate-700 border-slate-600 text-white",
              formFieldLabel: "text-slate-300",
              footerActionLink: "text-emerald-400 hover:text-emerald-300",
            }
          }}
        />
      </div>
    </div>
  );
}
