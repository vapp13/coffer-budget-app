import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function TestHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add an expense">
        <input aria-label="Description" />
        <input aria-label="Amount" />
        <Button type="submit">Save</Button>
      </Dialog>
    </div>
  );
}

describe("Dialog — accessibility", () => {
  it("has the expected dialog semantics", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Add an expense");
  });

  it("moves focus into the dialog when it opens", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    // First focusable element inside the dialog should receive focus.
    expect(screen.getByLabelText("Description")).toHaveFocus();
  });

  it("restores focus to the triggering element when the dialog closes", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps Tab focus within the dialog — wraps from the last to the first focusable element", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const saveButton = screen.getByRole("button", { name: "Save" });
    saveButton.focus();
    expect(saveButton).toHaveFocus();

    // Tabbing forward from the last focusable element should wrap to the
    // first (the close button — it's first in DOM order, in the header).
    await user.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("wraps backward with Shift+Tab from the first to the last focusable element", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const closeButton = screen.getByRole("button", { name: "Close" });
    closeButton.focus();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  });

  it("clicking the close button closes the dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Dialog>
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
