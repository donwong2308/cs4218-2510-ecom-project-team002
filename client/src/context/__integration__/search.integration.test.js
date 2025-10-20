import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchProvider, useSearch } from "../search";

// Simple consumer that reads and updates search context
const TestConsumer = () => {
  const [values, setValues] = useSearch();
  return (
    <div>
      <div data-testid="keyword">{values.keyword}</div>
      <div data-testid="results-count">{values.results.length}</div>
      <button
        data-testid="set-basic"
        onClick={() => setValues({ keyword: "shoes", results: [{ id: 1 }] })}
      >
        Set Basic
      </button>
      <button
        data-testid="set-partial"
        onClick={() => setValues({ ...values, keyword: "hats" })}
      >
        Set Partial
      </button>
    </div>
  );
};

const ConsumerOne = () => {
  const [values] = useSearch();
  return <div data-testid="c1">{values.keyword || ""}</div>;
};

const ConsumerTwo = () => {
  const [values] = useSearch();
  return <div data-testid="c2">{String(values.results.length)}</div>;
};

describe("Search Context Integration", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("provides initial values and allows updates", () => {
    render(
      <SearchProvider>
        <TestConsumer />
      </SearchProvider>
    );

    // Initial state
    expect(screen.getByTestId("keyword")).toHaveTextContent("");
    expect(screen.getByTestId("results-count")).toHaveTextContent("0");

    // Update via consumer
    fireEvent.click(screen.getByTestId("set-basic"));
    // Since SearchProvider stores raw object, the consumer sees new values immediately
    // We assert through the mock consumer output
    // Note: We don't spy setState here; we validate rendered output instead
    expect(screen.getByTestId("keyword")).toHaveTextContent("shoes");
    expect(screen.getByTestId("results-count")).toHaveTextContent("1");
  });

  test("synchronizes state across multiple consumers", () => {
    render(
      <SearchProvider>
        <TestConsumer />
        <ConsumerOne />
        <ConsumerTwo />
      </SearchProvider>
    );

    // All start empty
    expect(screen.getByTestId("keyword")).toHaveTextContent("");
    expect(screen.getByTestId("c1")).toHaveTextContent("");
    expect(screen.getByTestId("c2")).toHaveTextContent("0");

    // Update once
    fireEvent.click(screen.getByTestId("set-basic"));

    expect(screen.getByTestId("keyword")).toHaveTextContent("shoes");
    expect(screen.getByTestId("c1")).toHaveTextContent("shoes");
    expect(screen.getByTestId("c2")).toHaveTextContent("1");

    // Partial update (keyword only)
    fireEvent.click(screen.getByTestId("set-partial"));
    expect(screen.getByTestId("keyword")).toHaveTextContent("hats");
    expect(screen.getByTestId("c1")).toHaveTextContent("hats");
    // results preserved from previous update
    expect(screen.getByTestId("c2")).toHaveTextContent("1");
  });

  test("does not touch localStorage (no persistence responsibilities)", () => {
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

    render(
      <SearchProvider>
        <TestConsumer />
      </SearchProvider>
    );

    fireEvent.click(screen.getByTestId("set-basic"));

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});


