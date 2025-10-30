
# UI Upgrade Plan for Data Mapper Pro

## Objective
To perform an overall UI upgrade, focusing on enhancing the appearance and behavior of input elements and their various states across all components, ensuring consistency, responsiveness, and improved aesthetics.

## Rationale
The current codebase exhibits some inconsistency in UI styling, particularly for input fields and buttons, due to localized class definitions. The `ConfirmationModal` is also directly embedded in `App.tsx` rather than being a reusable common component. By centralizing UI class definitions and refactoring components to use these, we can achieve a more uniform, maintainable, and visually appealing application.

## Detailed Plan

### 1. Centralize UI Constants in `constants.tsx`

**Description:**
Define a comprehensive set of Tailwind CSS class strings for all common UI elements (inputs, buttons, icon buttons) within `constants.tsx`. This ensures a single source of truth for styling, making the UI consistent and easier to modify in the future.

**New Constants to Add/Modify:**

```typescript
// Input Field Styles
export const BASE_INPUT_CLASSES = "block w-full text-sm rounded-lg border-slate-300 bg-slate-50 shadow-sm transition-all duration-200 ease-in-out placeholder-slate-400";
export const FOCUS_INPUT_CLASSES = "focus:bg-white focus:border-emerald-500 focus:ring-emerald-500";
export const DISABLED_INPUT_CLASSES = "disabled:bg-slate-100 disabled:cursor-not-allowed";
export const ERROR_INPUT_CLASSES = "border-red-500 focus:border-red-500 focus:ring-red-500";
export const DEFAULT_INPUT_CLASSES = `${BASE_INPUT_CLASSES} ${FOCUS_INPUT_CLASSES} ${DISABLED_INPUT_CLASSES}`;

// Button Styles
export const PRIMARY_BUTTON_CLASSES = "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200";
export const SECONDARY_BUTTON_CLASSES = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200";
export const DANGER_BUTTON_CLASSES = "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200";
export const TEXT_DANGER_BUTTON_CLASSES = "inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors duration-200";

// Icon Button Styles
export const ICON_BUTTON_BASE_CLASSES = "text-slate-500 p-2 rounded-full hover:bg-slate-100 transition-colors duration-200";
export const ICON_BUTTON_HOVER_PRIMARY_CLASSES = "hover:text-emerald-600";
export const ICON_BUTTON_HOVER_INFO_CLASSES = "hover:text-blue-600";
export const ICON_BUTTON_HOVER_DANGER_CLASSES = "hover:text-red-600";
export const ICON_BUTTON_HOVER_PURPLE_CLASSES = "hover:text-purple-600";
export const ICON_BUTTON_HOVER_SLATE_CLASSES = "hover:text-slate-700";
```

### 2. Refactor and Relocate `ConfirmationModal`

**Description:**
The `ConfirmationModal` currently defined within `App.tsx` will be moved to its own reusable file (`components/common/ConfirmationModal.tsx`) and refactored to use the existing `Modal` component as its base.

**Steps:**
*   Create `components/common/ConfirmationModal.tsx`.
*   Move the JSX and logic for `ConfirmationModal` from `App.tsx` to `components/common/ConfirmationModal.tsx`.
*   Update `ConfirmationModal.tsx` to wrap its content in the `Modal` component, passing `title`, `isOpen`, `onClose`, and a custom `footer`.
*   Apply the new centralized button styles (`PRIMARY_BUTTON_CLASSES`, `SECONDARY_BUTTON_CLASSES`) to its buttons.

### 3. Update `App.tsx`

**Description:**
Adjust `App.tsx` to import and use the new `ConfirmationModal` component and update the toast notification styling.

**Steps:**
*   Remove the inline `ConfirmationModal` definition.
*   Import `ConfirmationModal` from `components/common/ConfirmationModal.tsx`.
*   Update the toast notification `div` to include more refined shadows and padding for better visual appeal.

### 4. Apply New Input and Button Styles to Components

**Description:**
Iterate through all relevant components, replacing their inline or locally defined `inputClasses` and `button*Classes` with the new centralized constants. This ensures all interactive elements adhere to the new consistent UI.

**Components to Update:**

*   **`components/MappingManager.tsx`**:
    *   Replace `inputClasses`, `buttonPrimaryClasses`, `buttonSecondaryClasses`, `iconButtonClasses`, `dangerIconButtonClasses` with the new constants.
    *   Apply `DEFAULT_INPUT_CLASSES` to all `<input>`, `<select>`, and `<textarea>` elements.
    *   Apply `PRIMARY_BUTTON_CLASSES`, `SECONDARY_BUTTON_CLASSES`, `ICON_BUTTON_BASE_CLASSES` with appropriate hover classes (`ICON_BUTTON_HOVER_PRIMARY_CLASSES`, `ICON_BUTTON_HOVER_INFO_CLASSES`, `ICON_BUTTON_HOVER_DANGER_CLASSES`, `ICON_BUTTON_HOVER_PURPLE_CLASSES`) to buttons.
    *   Adjust `table`, `thead`, `tbody`, `tr`, `th`, `td` styling for a consistent modern look.
    *   Ensure `font-mono` is retained for schema textareas in `GeminiSuggestModal`.

*   **`components/CategoryManager.tsx`**:
    *   Replace `inputClasses`, `buttonPrimaryClasses`, `buttonDangerClasses` with new constants.
    *   Apply `DEFAULT_INPUT_CLASSES` to the new category input.
    *   Conditionally add `ERROR_INPUT_CLASSES` if `error` is present.
    *   Apply `PRIMARY_BUTTON_CLASSES` and `TEXT_DANGER_BUTTON_CLASSES` to buttons.
    *   Adjust `table`, `thead`, `tbody`, `tr`, `th`, `td` styling.

*   **`components/JsonViewer.tsx`**:
    *   Replace `inputClasses`, `buttonPrimaryClasses` with new constants.
    *   Apply `DEFAULT_INPUT_CLASSES` to the `<select>` element.
    *   Apply `PRIMARY_BUTTON_CLASSES` to the "Copy JSON" button.
    *   Ensure the `pre` element for JSON display retains its dark background and `font-mono`.

*   **`components/ApiClient.tsx`**:
    *   Replace `inputClasses`, `buttonPrimaryClasses`, `buttonSecondaryClasses`, `iconButtonClasses`, `dangerIconButtonClasses` with new constants.
    *   Apply `DEFAULT_INPUT_CLASSES` to all form inputs, selects, and textareas within `ApiClientForm`.
    *   Apply `PRIMARY_BUTTON_CLASSES`, `SECONDARY_BUTTON_CLASSES`, `ICON_BUTTON_BASE_CLASSES` with appropriate hover classes to buttons in the form and table.
    *   Adjust `table`, `thead`, `tbody`, `tr`, `th`, `td` styling.

*   **`components/IncomingRoutesManager.tsx`**:
    *   Replace `inputClasses`, `buttonPrimaryClasses`, `iconButtonClasses`, `dangerIconButtonClasses` with new constants.
    *   Apply `DEFAULT_INPUT_CLASSES` to all inputs, selects, and textareas within `IncomingAuthEditor`, `ConditionComponent`, and the main route form.
    *   Apply `PRIMARY_BUTTON_CLASSES`, `ICON_BUTTON_BASE_CLASSES` with appropriate hover classes to buttons.
    *   Adjust styling for `ConditionGroupComponent` and `ConditionComponent` to ensure clear visual hierarchy (e.g., background colors, borders).
    *   Adjust `table`, `thead`, `tbody`, `tr`, `th`, `td` styling.

*   **`components/OutgoingRoutesManager.tsx`**:
    *   Replace `inputClasses`, `buttonPrimaryClasses`, `iconButtonClasses`, `dangerIconButtonClasses` with new constants.
    *   Apply `DEFAULT_INPUT_CLASSES` to all inputs, selects, and textareas within `EgressTransformEditor` and `OutgoingAuthEditor`.
    *   Apply `PRIMARY_BUTTON_CLASSES`, `ICON_BUTTON_BASE_CLASSES` with appropriate hover classes to buttons.
    *   Adjust styling for `EgressTransformEditor` (e.g., background colors, borders).
    *   Adjust `table`, `thead`, `tbody`, `tr`, `th`, `td` styling.

*   **`components/LogViewer.tsx`**:
    *   Replace `inputClasses`, `buttonDangerTextClasses` with new constants.
    *   Apply `DEFAULT_INPUT_CLASSES` to the search input.
    *   Apply `TEXT_DANGER_BUTTON_CLASSES` to the "Clear Logs" button.
    *   Ensure `pre` elements for JSON display maintain dark background and `font-mono`.
    *   Adjust `table`, `thead`, `tbody`, `tr`, `th`, `td` styling for logs.

### 5. Remove `components/ApiTester.tsx`

**Description:**
The `ApiTester.tsx` file is empty and no longer serves a purpose since `ApiClient.tsx` handles API testing functionality.

**Steps:**
*   Delete `components/ApiTester.tsx`.

### 6. Review and Final Polish

**Description:**
Conduct a thorough review of the entire application to ensure all UI elements render correctly and consistently across different states and screen sizes.

**Steps:**
*   Visually inspect all components to confirm consistent styling of inputs, buttons, and overall layouts.
*   Test input fields for default, hover, focus, disabled, and error states.
*   Verify responsiveness on various screen sizes (using browser developer tools).
*   Check keyboard navigability and `aria` attributes for accessibility.

## Dependencies

*   Tailwind CSS (already configured).
*   React (already configured).

## Classmap / UI Element Mapping

This table maps common UI elements to the new centralized class constants.

| UI Element Type    | Old Local Variable (Example)       | New Centralized Constant        | Usage Notes                                                                                                                                                                                                                                                                                                                                                                      |
| :----------------- | :--------------------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inputs/Textareas/Selects** | `inputClasses`                     | `DEFAULT_INPUT_CLASSES`         | Apply to all `<input type="text/number/password">`, `<textarea>`, `<select>` elements.                                                                                                                                                                                                                                                                                  |
|                    | N/A (conditional error)            | `ERROR_INPUT_CLASSES`           | Conditionally add to `DEFAULT_INPUT_CLASSES` when an input is in an error state (e.g., `className={`${DEFAULT_INPUT_CLASSES} ${error ? ERROR_INPUT_CLASSES : ''}`}`).                                                                                                                                                                                             |
| **Primary Buttons** | `buttonPrimaryClasses`             | `PRIMARY_BUTTON_CLASSES`        | For main actions (e.g., "Add Mapping", "Save Route").                                                                                                                                                                                                                                                                                                                            |
| **Secondary Buttons** | `buttonSecondaryClasses`           | `SECONDARY_BUTTON_CLASSES`      | For less prominent actions (e.g., "Cancel", "Run API Client Test").                                                                                                                                                                                                                                                                                                              |
| **Danger Buttons** | N/A (sometimes `bg-red-600`)       | `DANGER_BUTTON_CLASSES`         | For destructive actions where a prominent red button is needed.                                                                                                                                                                                                                                                                                                                  |
| **Text Danger Buttons** | `buttonDangerTextClasses`          | `TEXT_DANGER_BUTTON_CLASSES`    | For destructive text-only actions (e.g., "Clear Logs", "Delete Category").                                                                                                                                                                                                                                                                                                       |
| **Icon Buttons**   | `iconButtonClasses`                | `ICON_BUTTON_BASE_CLASSES`      | Apply to all buttons containing only an icon.                                                                                                                                                                                                                                                                                                                                    |
|                    | `hover:text-blue-600` (example)    | `ICON_BUTTON_HOVER_INFO_CLASSES` | Add specific `ICON_BUTTON_HOVER_*_CLASSES` to `ICON_BUTTON_BASE_CLASSES` for varied hover effects (e.g., `hover:text-emerald-600` for success/primary, `hover:text-red-600` for delete, `hover:text-blue-600` for edit/info).                                                                                                                                      |
| **Card/Panel Background** | `bg-white rounded-xl shadow-md border border-slate-200 p-X` | N/A (pattern)                   | This pattern is already consistent and will continue to be used for main content blocks. No direct constant needed as it's a structural class set.                                                                                                                                                                                                                |
| **Table Headers**  | `bg-slate-100`                     | N/A (pattern)                   | Keep `bg-slate-100` for table headers (`thead`).                                                                                                                                                                                                                                                                                                                                 |
| **Table Rows**     | `hover:bg-slate-50` or `hover:bg-emerald-50/10` | N/A (pattern)                   | Keep existing hover styles for table rows based on context (e.g., `hover:bg-emerald-50/10` for main items, `hover:bg-slate-50` for nested items).                                                                                                                                                                                                                          |
| **Code Blocks**    | `bg-slate-800 text-white p-X rounded-lg text-xs font-mono overflow-auto border border-slate-700` | N/A (pattern)                   | Maintain this pattern for `pre` and `code` elements displaying JSON or code snippets.                                                                                                                                                                                                                                                                            |

## ER Diagrams / Flow Diagrams
Not applicable for this UI-focused task. The data models (`types.ts`) and component interaction logic remain largely unchanged, only their presentation is being updated.

## UI Sketch (Conceptual)

**Before:**
- Inputs: Varying border radius, border colors, focus styles.
- Buttons: Different padding, inconsistent hover/focus.
- Modals: Confirmation modal looks different from the common `Modal`.

**After (Conceptual):**
```
+-------------------------------------------------------------+
| Sidebar (Left)                                              | Main Content Area (Right)                       |
|   - Navigation Items (consistent hover, active states)      |                                                 |
|                                                             | [Header: Manage Mappings]                       |
|                                                             |                                                 |
|                                                             | +---------------------------------------------+ |
|                                                             | | [Search Input (DEFAULT_INPUT_CLASSES)] X    | |
|                                                             | |                                             | |
|                                                             | | [Import CSV (SECONDARY_BUTTON_CLASSES)]     | |
|                                                             | | [Add Mapping (PRIMARY_BUTTON_CLASSES)]      | |
|                                                             | +---------------------------------------------+ |
|                                                             |                                                 |
|                                                             | [Mapping Table]                                 |
|                                                             | +---------------------------------------------+ |
|                                                             | | Name         | Category | Last Modified | Actions |
|                                                             | |--------------|----------|---------------|---------|
|                                                             | | Mapping 1    | Cat A    | YYYY-MM-DD    | [AI (Icon Button Purple)] [Edit (Icon Button Blue)] [Delete (Icon Button Red)] |
|                                                             | +---------------------------------------------+ |
|                                                             | |   [Expanded Datamap Entries Table]          | |
|                                                             | |     +-----------------------------------+   | |
|                                                             | |     | Source Field | Target Field | Actions | |
|                                                             | |     |--------------|--------------|---------| |
|                                                             | |     | field_a      | field_x      | [Edit (Icon Button Blue)] [Delete (Icon Button Red)] |
|                                                             | |     +-----------------------------------+   | |
|                                                             | |     | [Input (DEFAULT_INPUT_CLASSES)] | [Add (PRIMARY_BUTTON_CLASSES)] |
|                                                             | |     +-----------------------------------+   | |
|                                                             | +---------------------------------------------+ |
|                                                             |                                                 |
|                                                             | [Toast Notification]                            |
|                                                             | +---------------------------------------------+ |
|                                                             | | [Success/Error Message with modern shadow]  | |
|                                                             | +---------------------------------------------+ |
|                                                             |                                                 |
|                                                             | [Confirmation Modal (using Modal component)]    |
|                                                             | +---------------------------------------------+ |
|                                                             | | [Modal Title]                               | |
|                                                             | | [Modal Message]                             | |
|                                                             | | -----------------------------------------   | |
|                                                             | |           [Cancel (SECONDARY)] [Confirm (DANGER)] |
|                                                             | +---------------------------------------------+ |
+-------------------------------------------------------------+
```
