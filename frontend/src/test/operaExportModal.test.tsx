import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OperaExportModal } from "../components/layout/OperaExportModal";

describe("OperaExportModal", () => {
  it("preselects the active novel and forwards export requests", () => {
    const onExport = vi.fn().mockResolvedValue(undefined);

    render(
      <OperaExportModal
        exportResult={undefined}
        exporting={false}
        initialNovelId="novel_01"
        isOpen
        novels={["novel_00", "novel_01"]}
        onClose={() => undefined}
        onExport={onExport}
        onRefreshStatus={() => undefined}
        status={{
          ok: true,
          reachable: true,
          baseUrl: "http://127.0.0.1:8000/api",
          supportedSecretHandling: ["director_only"],
        }}
        statusLoading={false}
      />,
    );

    expect(screen.getByDisplayValue("novel_01")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(onExport).toHaveBeenCalledWith("novel_01");
  });
});
