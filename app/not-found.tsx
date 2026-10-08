import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="num text-[13px] text-accent">404</span>
      <h1 className="mt-3 text-[40px] font-semibold tracking-[-0.04em]">No round here.</h1>
      <p className="mt-3 text-muted">This page doesn&apos;t exist. The live round does.</p>
      <ButtonLink href="/#play" className="mt-8">
        Enter the Round
      </ButtonLink>
    </div>
  );
}
