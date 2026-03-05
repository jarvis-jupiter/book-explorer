import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchForm } from "../SearchForm.js";

describe("SearchForm", () => {
  it("renders a search input and submit button", () => {
    render(<SearchForm />);
    expect(screen.getByRole("searchbox")).toBeDefined();
    expect(screen.getByRole("button", { name: /search/i })).toBeDefined();
  });

  it("pre-fills the input with the defaultQuery prop", () => {
    render(<SearchForm defaultQuery="tolkien" />);
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.value).toBe("tolkien");
  });

  it("shows placeholder text", () => {
    render(<SearchForm />);
    const input = screen.getByPlaceholderText(/search by title/i);
    expect(input).toBeDefined();
  });
});
