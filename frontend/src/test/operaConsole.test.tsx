import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OperaConsole } from "../components/layout/OperaConsole";

describe("OperaConsole", () => {
  it("shows the configured frontend url and refreshes backend status", () => {
    const onRefreshStatus = vi.fn();

    render(
      <OperaConsole
        frontendUrl="http://127.0.0.1:5173"
        onRefreshStatus={onRefreshStatus}
        status={{
          ok: true,
          reachable: true,
          baseUrl: "http://127.0.0.1:8000/api",
          service: "novel-writer-import",
          supportedSecretHandling: ["director_only"],
        }}
        statusLoading={false}
      />,
    );

    expect(screen.getByText(/Opera backend is reachable/i)).toBeInTheDocument();
    expect(screen.getByText(/http:\/\/127\.0\.0\.1:5173/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh Status" }));
    expect(onRefreshStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle("Opera console")).toHaveAttribute("src", "http://127.0.0.1:5173");
  });
});
