import React from "react";
import {
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

afterEach(() => {
  cleanup();
  localStorage.clear();
  jest.restoreAllMocks();
});

function CartConsumer() {
  const [cart] = useCart();
  return <div data-testid="count">{cart.length}</div>;
}

describe("CartProvider", () => {
  test("Initialize localStorage", async () => {
    const stored = [{ id: 42, name: "Stored Item" }];
    localStorage.setItem("cart", JSON.stringify(stored));

    const getItemSpy = jest.spyOn(window.localStorage.__proto__, "getItem");

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });

    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(getItemSpy).toHaveBeenCalledWith("cart");
  });

  test("Empty cart if localStorage no cart", async () => {
    const getItemSpy = jest.spyOn(window.localStorage.__proto__, "getItem");

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("0");
    });

    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(getItemSpy).toHaveBeenCalledWith("cart");
  });

  test("Effect runs only once on mount", async () => {
    const getItemSpy = jest.spyOn(window.localStorage.__proto__, "getItem");
    localStorage.setItem("cart", JSON.stringify([{ id: 1 }]));

    const { rerender } = render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });

    rerender(
      <CartProvider>
        <div>
          <CartConsumer />
        </div>
      </CartProvider>
    );

    expect(getItemSpy).toHaveBeenCalledTimes(1);
  });
});
