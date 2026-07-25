import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button — type defaults", () => {
  it("defaults to type='button', so it never submits an ancestor form", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <form onSubmit={onSubmit}>
        <Button onClick={onClick}>Edit</Button>
      </form>
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    // This is the exact bug class that broke deduction edit/remove buttons
    // twice: a button with no explicit type defaults to type="submit" inside
    // a <form>, so clicking it submits the whole form instead of (or in
    // addition to) running its own onClick. The Button component's default
    // must prevent that categorically, not just for buttons someone
    // remembered to mark explicitly.
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("still submits when type='submit' is explicitly requested", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const user = userEvent.setup();

    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save changes</Button>
      </form>
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button onClick={onClick} disabled>
        Add deduction
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Add deduction" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
