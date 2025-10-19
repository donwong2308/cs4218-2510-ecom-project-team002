// context/__tests__/cart.hook.integration.test.js
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "../cart";

beforeEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

test("initializes cart from localStorage", () => {
  const seed = [{ _id: "1", name: "A", price: 10, quantity: 2 }];
  jest
    .spyOn(Storage.prototype, "getItem")
    .mockReturnValue(JSON.stringify(seed));

  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
  const { result } = renderHook(() => useCart(), { wrapper });

  const [cart] = result.current;
  expect(localStorage.getItem).toHaveBeenCalledWith("cart");
  expect(cart).toEqual(seed);
});

test("provides [cart, setCart] tuple", () => {
  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
  const { result } = renderHook(() => useCart(), { wrapper });

  const [cart, setCart] = result.current;
  expect(Array.isArray(cart)).toBe(true);
  expect(typeof setCart).toBe("function");
});

test("setCart updates state and persists to localStorage", async () => {
  const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
  const { result } = renderHook(() => useCart(), { wrapper });

  act(() => {
    const [, setCart] = result.current;
    setCart([{ _id: "2", name: "B", price: 5, quantity: 1 }]);
  });

  // If your provider persists via useEffect, wait for it:
  await waitFor(() => {
    expect(setItemSpy).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([{ _id: "2", name: "B", price: 5, quantity: 1 }])
    );
  });

  const [cart] = result.current;
  expect(cart).toEqual([{ _id: "2", name: "B", price: 5, quantity: 1 }]);
});

test("does not write to localStorage on mount", () => {
  const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
  const getItemSpy = jest
    .spyOn(Storage.prototype, "getItem")
    .mockReturnValue(null);

  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
  renderHook(() => useCart(), { wrapper });

  expect(getItemSpy).toHaveBeenCalledWith("cart");
  expect(setItemSpy).not.toHaveBeenCalled();
});

test("handles invalid JSON in localStorage gracefully", () => {
  jest.spyOn(Storage.prototype, "getItem").mockReturnValue("{not: json");
  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

  // no throw
  const { result } = renderHook(() => useCart(), { wrapper });
  const [cart] = result.current;
  expect(cart).toEqual([]); // default
});
