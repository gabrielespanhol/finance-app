# PROJECT CONTEXT

**Description:**
Financial management system for tracking, viewing, and analyzing income and expenses. Supports categorization and import from statement files (CSV and OFX).

**Apparent Goal:**
Help users manage finances by providing clear insights through filtered lists and balance charts.

**Application Type:**
Client-server web application (React SPA consuming a Node.js REST API).

---

# CURRENT ARCHITECTURE

## Frontend (/frontend)

Organized into:

* components
* pages
* hooks
* services
* utils

Critical observation:
Core logic is centralized in:

* `useTransactions.js` → acts as a God Object

Responsibilities include:

* Feature state management
* HTTP requests
* Filtering and selection logic
* Modal control
* Data transformation for charts

UI components are mostly passive and depend on this hook.

---

## Backend (/backend)

Simple monolithic Express structure:

* `index.js` → app bootstrap
* `db.js` → SQLite connection + table creation + seeds
* `/routes/transactions.js` → routing + file parsing
* `/services/transactionService.js` → data access + partial business logic

Current flow:

UI → Hook → Axios → Route → Service → SQLite

---

# STACK AND DEPENDENCIES

## Frontend:

* React (Vite)
* TailwindCSS
* Axios
* Recharts

Identified issue:

* `multer` incorrectly present in frontend dependencies

---

## Backend:

* Node.js (CommonJS)
* Express
* SQLite3
* Multer
* Cors

---

# PROJECT PATTERNS

## Naming:

* React Components: PascalCase (.jsx)
* Hooks / Utils / Backend: camelCase (.js)

## Backend:

* Uses callbacks (`(err, result) => {}`)
* Direct SQLite usage via `db.run`, `db.get`, `db.all`

## Frontend:

* Tailwind as primary styling approach
* State centralized in hooks
* Minimal use of CSS files

---

# IDENTIFIED PROBLEMS

## Critical:

* High coupling in `useTransactions.js`
* Heavy use of callbacks (callback hell)
* File leak risk (multer + fs without guaranteed cleanup)
* File parsing inside route layer
* Raw internal errors returned in responses (security risk)

## Moderate:

* Hardcoded URLs (`localhost`)
* No environment variable usage
* Mixed responsibilities in services

---

# AGENT GUIDELINES

## Mandatory rules:

* DO NOT change architecture without explicit justification
* DO NOT install dependencies without approval
* DO NOT update existing dependency versions
* DO NOT remove existing dependencies
* ALWAYS follow existing project patterns
* DO NOT introduce unnecessary abstractions

---

# MANDATORY EXECUTION FLOW

Before making any changes:

1. Analyze relevant files
2. Explain what will be done
3. Provide technical justification
4. List potential impacts

Wait for explicit approval before implementing

---

## During implementation:

* Make small, isolated changes
* Avoid modifying multiple modules at once
* Preserve existing behavior

---

# REFACTORING POLICY

Refactoring is NOT automatic.

Allowed only when:

* A clear problem is identified
* The impact is small and controlled

Forbidden:

* Large-scale refactoring
* Global migration (e.g., callbacks → async/await)
* Changing folder structure without approval
* Introducing new architectural patterns

---

# EVOLUTION PRIORITIES

Mandatory order:

1. Bugs and security issues
2. Data and persistence problems
3. Resource leaks (files/memory)
4. High coupling areas (e.g., useTransactions.js)
5. Structural improvements

Avoid cosmetic changes

---

# HOW TO CREATE NEW FEATURES

## Frontend:

* Reusable logic → `/utils`
* UI components → `/components`
* API integration → `/services`
* New state → create NEW hook (do not expand useTransactions)

---

## Backend:

For new entities:

* Create:

  * `/routes/<entity>.js`
  * `/services/<entity>Service.js`

* Maintain callback pattern unless explicitly approved otherwise

---

# PROJECT-SPECIFIC BEST PRACTICES

* Use existing utilities (e.g., date formatting)
* Respect category fallback ("Others")
* Use existing color mapping in frontend
* Prioritize consistency with current code

---

# WHAT TO AVOID

* Expanding `useTransactions.js`
* Writing parsing logic inside routes
* Ignoring error handling
* Chaining uncontrolled database queries
* Adding unnecessary complexity

---

# DEPENDENCY RULES

Before installing any dependency:

1. Explain why it is needed
2. Provide an alternative without it
3. Request explicit approval

---

# FINAL RESTRICTIONS

* DO NOT make changes without planning
* DO NOT assume implicit behavior
* DO NOT modify multiple areas without control
* DO NOT optimize prematurely

---

# FINAL OBJECTIVE

Maintain the system:

* Functional
* Stable
* Evolvable with control
* Without unnecessary complexity
* Aligned with the current code reality