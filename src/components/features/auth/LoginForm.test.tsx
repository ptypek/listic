import React from "react";

import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LoginForm } from "./LoginForm";

test("LoginForm renders correctly", () => {
  render(<LoginForm />);

  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /zaloguj się/i })).toBeInTheDocument();
});

test("allows user to type in email and password", async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  const emailInput = screen.getByLabelText("Email");
  await user.type(emailInput, "test@example.com");
  expect(emailInput).toHaveValue("test@example.com");

  const passwordInput = screen.getByLabelText(/hasło/i);
  await user.type(passwordInput, "password123");
  expect(passwordInput).toHaveValue("password123");
});

test("displays error message on failed login", async () => {
  const user = userEvent.setup();
  // Mock the fetch function to simulate a failed login
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid credentials" }),
    } as Response)
  );

  render(<LoginForm />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText(/hasło/i), "wrongpassword");
  await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

  // Wait for the error message to appear
  const errorMessage = await screen.findByText("Invalid credentials");
  expect(errorMessage).toBeInTheDocument();
});

test("redirects on successful login", async () => {
  const user = userEvent.setup();
  // Mock the fetch function to simulate a successful login
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
    } as Response)
  );

  // Mock window.location.href
  Object.defineProperty(window, "location", {
    value: {
      href: "",
    },
    writable: true,
  });

  render(<LoginForm />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(screen.getByLabelText(/hasło/i), "password123");
  await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

  // Check if window.location.href was changed
  expect(window.location.href).toBe("/");
});
