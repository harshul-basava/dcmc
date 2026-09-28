# Dashboard Airtable setup

The dashboard's existing roster, schedule, settings, and feedback use the
**DC Mini-Conference** base (`appZ3PpQjBx0UzJ3u`). Set `AIRTABLE_API_TOKEN`
(or `AIRTABLE_KEY`) and `AIRTABLE_BASE_ID` in the environment that runs Next.js.
A GitHub Actions secret by itself is not a runtime environment variable.

The running app's token needs `data.records:read` and `data.records:write` on
this base. Airtable schema changes require `schema.bases:write` and creator
access. Never use the committed development session secret or admin password
in production.

## Additional tables

These tables now exist in the DC Mini-Conference base. The app uses their IDs
by default: `Schedule Assignments` is `tblBjgQ0kJqcD3xr7` and `Conversation
Preferences` is `tblUXnGxDqnvY0CqH`. Override them with
`AIRTABLE_ASSIGNMENTS_TABLE` and `AIRTABLE_PREFERENCES_TABLE` when using a
different base. The field names below are part of the app's mapping.

### Schedule Assignments

| Field | Airtable type | Notes |
| --- | --- | --- |
| Assignment | Single line text | Primary field |
| Session | Link to Sessions | One record |
| Attendee | Link to Admit Confirmation | One record or empty |
| Speaker / Guest | Link to DCMC 2.0 Speakers and Guests | One record or empty |
| Group | Single line text | Pair/group label |
| Kind | Single select | `1:1`, `Small group` |
| State | Single select | `draft`, `published` |
| Location | Single line text | Optional |

### Conversation Preferences

| Field | Airtable type | Notes |
| --- | --- | --- |
| Preference | Single line text | Primary field |
| Person Type | Single select | `participant`, `guest` |
| Person Record ID | Single line text | Airtable record ID |
| Target Type | Single select | `participant`, `guest` |
| Target Record ID | Single line text | Airtable record ID |
| Rank | Number | Integer, 1 is strongest |
| For Day | Single line text | `YYYY-MM-DD` date of 1:1 block |

Feedback questions use the existing **Portal Page Settings** table. The admin
question editor saves one JSON definition per form under `all:questions:<form>`.
Attendee responses and their question labels are snapshotted in the existing
**Portal Feedback** table's `Answers JSON` field, so editing or removing a
question does not rewrite old responses. Ranked 1:1 target IDs are also saved
there; they can be read for pairings even before Conversation Preferences is
provisioned. After that table is connected, new daily feedback writes to both.

Pairings are saved as drafts in Schedule Assignments. Publishing them updates
their state and makes them visible to attendees; hiding them restores draft
state. Feedback submissions and ranked requests are saved to Portal Feedback,
and ranked requests are also synchronized to Conversation Preferences.
