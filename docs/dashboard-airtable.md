# Dashboard Airtable setup

The dashboard's existing roster, schedule, settings, and feedback use the
**DC Mini-Conference** base (`appZ3PpQjBx0UzJ3u`). The app uses that base ID
by default and reads the existing `AIRTABLE_API_TOKEN` from the Vercel runtime.
`AIRTABLE_KEY` is also accepted as an alias. Set `AIRTABLE_BASE_ID` only when
pointing this code at a different base.

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

## Admin controls and verification

- `/dashboard/admin/pairings` offers only `one-to-one` sessions. Each block
  generates two rounds, prioritizes ranked requests, and avoids repeating the
  same partner within the block. Guests require submitted Portal Availability
  covering the relevant half; attendees with exclusion markers are omitted.
  Draft generation does not change released pairings. Release replaces the live
  rows, and Hide removes the live rows while retaining an existing draft.
- `/dashboard/admin/feedback/questions` edits wording, order, required status,
  visibility, and rating scales, and adds written/rating questions.
- `/dashboard/admin/pages` controls the attendee Feedback page and each form.
  Both the page and the individual form must be enabled. Anytime remains open
  whenever the Feedback page is enabled. Other daily forms require an explicit
  admin release; they do not open automatically by date.
- `/dashboard/feedback/goals` has five required questions: motivation for working
  in AI governance, questions to resolve, the best possible three-day outcome,
  actions, and obstacles. Saved goals reload for review and updating. Goal
  responses are stored in Portal Feedback and visible to organizers, unlike the
  attendee-only goal responses in the original Lateral Workshop dashboard.
- Feedback success is shown only after Portal Feedback saves. A failed secondary
  preference sync does not invalidate that save, since ranked person keys are
  also stored in Answers JSON. Conversation ratings accept only the attendee's
  published conversations and snapshot the partner and time in their labels.

`npm test` covers pairing round conflicts, guest availability, exclusions,
release/hide behavior, feedback validation, anonymity, closed forms, preview
protection, storage errors, question editing, settings pagination, and all six
forms' Airtable field serialization/readback using a mocked HTTP service.
Browser checks use local fixture accounts; fixture writes reset on restart.
Live schema inspection confirms the default table/field mappings. A live app
submission still requires testing with the deployed runtime's Airtable token;
the connector's access to the base does not prove that token's write access.
