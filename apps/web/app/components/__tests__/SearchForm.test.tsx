import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

	it("calls onSubmit with the query value when form is submitted", async () => {
		const onSubmit = vi.fn();
		render(<SearchForm onSubmit={onSubmit} />);

		const input = screen.getByRole("searchbox");
		await userEvent.clear(input);
		await userEvent.type(input, "harry potter");
		await userEvent.click(screen.getByRole("button", { name: /search/i }));

		expect(onSubmit).toHaveBeenCalledWith("harry potter");
	});

	it("shows placeholder text", () => {
		render(<SearchForm />);
		const input = screen.getByPlaceholderText(/search by title/i);
		expect(input).toBeDefined();
	});
});
