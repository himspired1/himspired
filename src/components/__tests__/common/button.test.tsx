import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../../common/button/button.component";

describe("Button Component", () => {
  it("renders button with text", () => {
    render(<Button btnTitle="Click me" type="button" />);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button btnTitle="Click me" onClick={handleClick} type="button" />);

    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(
      <Button btnTitle="Click me" className="custom-class" type="button" />
    );

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("custom-class");
  });

  it("disables button when disabled prop is true", () => {
    render(<Button btnTitle="Click me" disabled type="button" />);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button
        btnTitle="Click me"
        onClick={handleClick}
        disabled
        type="button"
      />
    );

    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("shows loading spinner when loading is true", () => {
    render(<Button btnTitle="Click me" loading type="button" />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
    // When loading, the button should not have the text content
    expect(button).not.toHaveTextContent("Click me");
  });
});
