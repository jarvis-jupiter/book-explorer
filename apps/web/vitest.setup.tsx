import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock @remix-run/react for component unit tests
vi.mock("@remix-run/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@remix-run/react")>();
  return {
    ...actual,
    Form: ({
      children,
      ...props
    }: React.FormHTMLAttributes<HTMLFormElement> & { children?: React.ReactNode }) => (
      <form {...props}>{children}</form>
    ),
    Link: ({
      children,
      to,
      ...props
    }: {
      children?: React.ReactNode;
      to: string;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});
