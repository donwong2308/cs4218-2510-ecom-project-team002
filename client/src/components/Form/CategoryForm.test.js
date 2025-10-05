import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
  let handleSubmitMock;
  let setValueMock;

  beforeEach(() => {
    handleSubmitMock = jest.fn((e) => e.preventDefault());
    setValueMock = jest.fn();
  });

  it("renders input with initial value", () => {
    const { getByPlaceholderText } = render(
      <CategoryForm handleSubmit={handleSubmitMock} value="Test" setValue={setValueMock} />
    );

    const input = getByPlaceholderText("Enter new category");
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("Test");
  });

  it("calls setValue on input change", () => {
    const { getByPlaceholderText } = render(
      <CategoryForm handleSubmit={handleSubmitMock} value="" setValue={setValueMock} />
    );

    const input = getByPlaceholderText("Enter new category");
    fireEvent.change(input, { target: { value: "New Category" } });

    expect(setValueMock).toHaveBeenCalledWith("New Category");
  });

  it("calls handleSubmit on form submit", () => {
    const { getByText } = render(
      <CategoryForm handleSubmit={handleSubmitMock} value="" setValue={setValueMock} />
    );

    const button = getByText("Submit");
    fireEvent.click(button);

    expect(handleSubmitMock).toHaveBeenCalled();
  });
});
