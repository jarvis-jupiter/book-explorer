import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookCard } from "../BookCard.js";

describe("BookCard", () => {
  const baseProps = {
    id: "abc123",
    title: "Harry Potter and the Philosopher's Stone",
    authors: ["J.K. Rowling"],
    publisher: "Bloomsbury",
    description: "A young wizard discovers his magical heritage.",
    coverUrl: null,
  };

  it("renders book title", () => {
    render(
      <ul>
        <BookCard {...baseProps} />
      </ul>,
    );
    expect(screen.getByRole("heading", { name: /harry potter/i })).toBeDefined();
  });

  it("renders author names", () => {
    render(
      <ul>
        <BookCard {...baseProps} />
      </ul>,
    );
    expect(screen.getByText("J.K. Rowling")).toBeDefined();
  });

  it("renders publisher when provided", () => {
    render(
      <ul>
        <BookCard {...baseProps} />
      </ul>,
    );
    expect(screen.getByText("Bloomsbury")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(
      <ul>
        <BookCard {...baseProps} />
      </ul>,
    );
    expect(screen.getByText(/young wizard/i)).toBeDefined();
  });

  it("does not render img when coverUrl is null", () => {
    render(
      <ul>
        <BookCard {...baseProps} coverUrl={null} />
      </ul>,
    );
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders cover image when coverUrl is provided", () => {
    render(
      <ul>
        <BookCard {...baseProps} coverUrl="https://example.com/cover.jpg" />
      </ul>,
    );
    const img = screen.getByRole("img");
    expect(img).toBeDefined();
  });
});
