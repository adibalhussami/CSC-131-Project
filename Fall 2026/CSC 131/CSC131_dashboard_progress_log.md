# CSC 131 Waste Collection Dashboard Progress Log

## Working folder

`C:\School\SacState\Spring 2026\CSC 131`

## Project focus

Build a mobile-friendly waste collection survey and dashboard for Sacramento State. The current approach uses Google Forms/Google Sheets for data collection and Looker Studio, formerly Google Data Studio, for reporting and visualization.

## Files reviewed

- `CSC 131 - Project.docx`
- `SE_Project_Section_8-1.docx`
- `Dumpster Diver Data.xlsx`
- `Sacramento State_ Service Overview.xlsx`
- Discord HTML exports containing project discussions

## Project requirements identified

The dashboard should support:

- Pickup totals
- Average fullness
- Fullness categories and status colors
- Comparisons by building, location, waste stream, driver, and date
- Contamination tracking
- Overflow tracking
- Photos and comments
- Historical trends
- Filtering and report exports

Fullness status rules:

- Green: 0–49%
- Yellow: 50–79%
- Red: 80–100%

## Current workbook data

The `Dumpster Diver Data.xlsx` workbook contains:

### Form Responses

- Timestamp
- Enter Location
- Enter Bin ID
- Enter Driver name
- Waste Type
- Fullness
- Contamination Observed?
- Additional comments?

### Graph Test

- Locations
- Percent
- X
- Y

The `Sacramento State_ Service Overview.xlsx` workbook provides corrected campus service-location names. These names should be used when generating test data or mapping locations to broader buildings.

## Google Sheets setup completed

A separate `Dashboard Data` tab was created so the original `Form Responses` tab remains untouched.

The `Dashboard Data` tab copies the original response fields and adds calculated fields:

- Status
- Contamination Flag
- Overflow Flag
- Collection Date
- Fullness Category

The current calculated-column layout is:

- `I`: Status
- `J`: Contamination Flag
- `K`: Overflow Flag
- `L`: Collection Date
- `M`: Fullness Category

The current Status formula is:

```excel
=ARRAYFORMULA(IF(F2:F="","",IF(F2:F<50,"Green",IF(F2:F<80,"Yellow","Red"))))
```

The Overflow Flag currently searches the comments field for words such as `overflow`, `outside`, `spilled`, `spill`, `leak`, or `on the ground`. A dedicated overflow survey question should be added later because comment-based detection is only a temporary workaround.

## Simulated data added

Simulated response data was added for dashboard testing, including:

- 50 rows
- Corrected campus location names from the service overview workbook
- Simulated bin IDs using the `SIM-###` pattern
- Multiple drivers
- Landfill, Recycling, and Organics waste types
- Fullness values of 0, 25, 50, 75, and 100
- Contamination and overflow examples

The data is for demonstration only and should remain separate from production responses when possible.

## Looker Studio work completed

The dashboard was started with four scorecards:

1. Total Pickups — Record Count
2. Average Fullness — Fullness aggregated by Average
3. Red Status Records — Record Count filtered where Status equals Red
4. Contamination Records — Record Count filtered where Contamination Flag equals Yes

Recommended filters:

- Collection Date
- Location or Building
- Driver Name
- Waste Type

## Recommended dashboard architecture for the next session

Avoid putting every record and every bin on one page. Use multiple pages with different levels of detail.

### Page 1: Campus Overview

Use building-level summaries only:

- Four scorecards
- Date and dropdown filters
- Average fullness by building
- Status distribution
- Contamination and overflow by building
- Fullness trend
- Top 10 or 15 problem buildings

Do not show individual Bin IDs on the Overview page.

### Page 2: Building Details

Use a Building dropdown filter and show:

- Selected building totals
- Average fullness
- Red-status records
- Contamination records
- Fullness trends
- Waste stream breakdown
- Individual bin table

### Page 3: Pickup Records

Show the detailed record table with:

- Collection Date
- Building
- Exact location
- Bin ID
- Driver
- Waste Type
- Fullness
- Status
- Contamination Flag
- Overflow Flag
- Comments

## Important data-model improvement

Add a normalized `Building` field. Keep the original exact collection point as `Enter Location`.

Use:

- `Building` for Overview charts
- `Enter Location` for building-detail analysis
- `Bin ID` for record-level analysis

Example:

| Building | Enter Location | Bin ID |
|---|---|---|
| Library | LIBRARY - BOOK REC | SIM-040 |
| Library | LIBRARY CP | SIM-041 |
| University Union | UNIV UNION E.DOCK | SIM-050 |

## Research conclusions

Google Sheets is suitable as the central survey-data store. Apps Script can handle validation, calculations, alerts, and automation. Looker Studio is suitable as the reporting and dashboard layer.

Looker Studio is not a full replacement for a data-entry or workflow application. Google Forms or a custom Apps Script form should remain responsible for collecting responses. Looker Studio should focus on filtering, charts, scorecards, trends, and reports.

Sensors were discussed but intentionally deferred. The current phase will focus on the survey and dashboard first.

## Next session starting point

1. Verify that the `Dashboard Data` tab is updating correctly.
2. Add or confirm the normalized `Building` field.
3. Change the Looker Studio canvas to a wide layout.
4. Build the Campus Overview page using building-level charts.
5. Move individual-bin records to a separate Building Details or Pickup Records page.
6. Test all filters and scorecards using the simulated data.
