# Frontend Changelog — April 3–19, 2026

## Overview

This document summarizes all frontend work done between **April 3 and April 19, 2026** across the Banka-1-Frontend project.

---

## Features

### Exchange / Berza
- Built the full exchange (berza) page — it was missing entirely and has now been added
- Added exchange list with table display, status badge, and working hours toggle
- Added open/closed toggle to the exchanges page

### Stocks / Securities (Hartije od vrednosti)
- Implemented securities list and detail views (tasks 14, 15, 16)
- Replaced orders view with stocks view
- Added admin panel integration for securities
- Fixed `getStocks()` API integration
- Fixed stock chart rendering for single-point data
- Added a refresh-all endpoint integration
- Added stock filter functionality

### Options Trading
- Implemented the options (opcije) feature
- Fixed period stats reflection, option chain mapping, and added strike/date filters
- Removed mock data from `OptionChain` and replaced with real API calls

### Loans / Krediti
- Implemented loan request form (F6, task implemetirana forma za zahtev kredita)
- Built loan list and loan details views (F7, F8)
- Added loan management portal for employees (F10, F11)
- Integrated full loan API: display loans, request loan, approve/decline loans
- Normalized loan model fields across the UI
- Consolidated loan enums and labels into `loan.model.ts`
- Added loans icon to the sidebar menu

### Card Management / Kartice
- Built card list view for clients (F3)
- Implemented request new card (F4) and block card (F5) with backend integration
- Fixed card masking issue (masked number returned from backend; blocking requires full number — known backend limitation)
- Updated base API URL in `CardService`
- Added mock `CardService` scaffold

### Exchange Rates / Menjačnica
- Implemented client-facing exchange rate view (menjačnica za klijenta)
- Added exchange rate course feature (feature/menjacnicaKurs)

### Actuarial / Aktuari Management
- Built agent list portal (F12, Portal aktuara — Lista agenata)
- Implemented actuarial management with API fixes

### Account Management
- Implemented account management feature (F6 — Account Management)
- Fixed API integration for account list
- Performed UI edits on the account list view
- Fixed supervisor redirect after login (now redirects to `/clients` instead of `/employees`)

---

## Bug Fixes

- Fixed reset limit logic
- Fixed option chain mapping and period stats
- Fixed loan model field normalization
- Fixed API integration across multiple services
- Fixed stock API — only first stock was loading; remaining couldn't be found on backend
- Fixed actuarial management API calls
- Fixed routing (App routing edit)

---

## Refactoring & Cleanup

- Removed mock data from `LoanService` and `SecuritiesService`
- Removed mock data from `OptionChain`
- Removed Cypress generated files; updated `.gitignore`
- Fixed review comments on multiple pull requests

---

## CI/CD

- Added a CI pipeline with Cypress and ESLint — subsequently reverted due to issues
- Ongoing work on CI/CD configuration

---

## Pull Requests Merged (April 3–13)

| PR | Description |
|----|-------------|
| #116 | Janko — options/stock fixes |
| #115 | Janko — stock detail + misc fixes |
| #112 | IgorGajic — API fixes |
| #111 | IgorGajic — loan fixes |
| #110 | Revert CI pipeline |
| #109 | CI pipeline with Cypress and ESLint (reverted) |
| #108 | inatrgovcevic — fixes |
| #107 | skiterrr — Request card & block card (F4/F5) |
| #106 | andrijamilic03 — Loan request |
| #105 | adilukic — Exchange rate (menjačnica kurs) |
| #104 | andrijamilic03 — API fix |
| #103 | Andrej-D — Securities list/details (14-15-16) |
| #102 | Kosta-D — Card list |
| #101 | markostojicic03 — Loan list / Loan details (F7/F8) |
| #100 | aromcevic6622rn — Exchange list |
| #99  | markostojicic03 — Account management (F6) |
| #98  | amojovic — Actuarial portal / agent list (F12) |
