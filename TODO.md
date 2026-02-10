# TODO: Fix "Error fetching investment data" in AddMutasiDialog

## Information Gathered

- The error occurs in `AddMutasiDialog` component when calling `fetchInvestmentData` for an investor.
- The fetch request is made to `/api/investment/${investorId}`, where `investorId` is the investor's `kode`.
- In the API route (`src/app/api/investment/[investorId]/route.ts`), it attempts to find the investor by `kode`, calculate investment data (saldo_akhir, dana_terpakai, bagi_hasil), and return JSON.
- If the investor is not found, it returns 404. On any error, it returns 500 with a generic message.
- In the dialog, if the response is not ok, it logs a generic "Error fetching investment data" without details.
- Potential issues: Investor not found (invalid kode), database query failures, calculation errors (e.g., division by zero), or missing data handling.
- The API uses Prisma to query `investor`, `mutasiRecord`, and `breakdown` models. Calculations involve aggregating data for the current month and all investors.

## Plan

- **Edit `src/app/history/add-mutasi-dialog.tsx`**: Enhance error logging in `fetchInvestmentData` to include response status, status text, and response body for better debugging.
- **Edit `src/app/api/investment/[investorId]/route.ts`**: Add console logging at key points (e.g., after finding investor, after calculations) and include error details in the 500 response for debugging. Ensure calculations handle edge cases (e.g., no records, zero values).
- **Dependent Files**: None directly, but changes affect how errors are reported and logged.
- **Followup Steps**:
  - Test the application by triggering the fetch (e.g., selecting an investor in the dialog).
  - Check browser console and server logs for detailed error messages.
  - If the error persists, investigate based on logs (e.g., if investor not found, check kode validity; if calculation error, review data).
  - Revert or refine changes if needed after testing.

## Confirmation

Please confirm if I can proceed with this plan. Let me know if you have any feedback or additional details.
