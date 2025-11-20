# Partner & Pump Guidelines

---

## Developer Manual

#### Prerequisites
| Tool | Version | Purpose |
|------|----------|----------|
| Node.js | ≥ 18.x | JavaScript runtime |
| npm | ≥ 9.x | Package manager |
| Expo CLI | 6.x | Run React Native apps |

#### How to obtain the source code:
  1. Clone the repository
      Anyone can access the source code by cloning this public GitHub repository:
```
git clone https://github.com/AmmaarSiddiqui/Partner-And-Pump
```
  3. Navigate into the project directory
      cd Partner-And-Pump

# Directory Structure
 ```
Partner-And-Pump/
├─ .expo/
├─ .github/
│  └─ workflows/
│     └─ ci-js.yml
├─ IOS/
├─ __tests__/
├─ app/
├─ functions/
│  ├─ __tests__/
│  ├─ src/
│  │  ├─ match/
│  │  ├─ notifications/
│  │  └─ validation/
│  ├─ jest.config.js
│  ├─ package.json
│  ├─ package-lock.json
│  └─ tsconfig.json
├─ node_modules/
├─ reports/
├─ src/
├─ .gitignore
├─ App.js
├─ DeveloperDocument.md
├─ README.md
├─ USERMANUAL.md
├─ app.json
├─ babel.config.js
├─ coding-guidelines.md
├─ package-lock.json
├─ package.json
└─ tsconfig.json
```


# How to build software: 
This project has two build targets:

1. Mobile client (Expo React Native) — lives in the app/ folder (started from the repo root).

2. Backend (Firebase Cloud Functions, TypeScript) — lives in functions/.

Follow the steps below to build all components locally and verify everything with tests.

#### Install once
```
npm i -g firebase-tools   # deploy/emulate backend
```

#### Expo CLI is invoked via npx, no global install required

1) Clone & install
```
git clone https://github.com/AmmaarSiddiqui/Partner-And-Pump.git
cd Partner-And-Pump
```
#### Install root dependencies (Expo app and tooling)
```
npm ci
```

#### Install backend deps
```
cd functions
npm ci
cd ..
```
#### Environment Variables
Make sure to email mas954@uw.edu for environment variables (Currently should not be needed)

2) Build & run the mobile client (Expo)
#### From repo root
#### Clear cache on first run while we’re evolving dependencies
```
cd Partner-And-Pump
npx expo start -c
```
Download the Expo Go App. 
Scan the QR code with Expo Go (iOS/Android) to open Partner And Pump on your device.

Make sure your phone and computer are on the same network.

This will prebuild native projects and open the iOS Simulator.


3) Build & run the backend (Cloud Functions)

### TypeScript → JavaScript build:
```
cd functions
npm run build    # transpiles to lib/
```

4) Lint & type-check (optional but recommended)
#### Frontend (if ESLint config is present)
```
npm run lint
```

# Backend TS type-check
```
cd functions
npm run typecheck     # or: npx tsc --noEmit
cd ..
```

#### How to run tests: 
Testing ensures that both the **mobile client (Expo app)** and **Firebase backend** perform correctly and remain stable as new features are introduced.
Partner & Pump uses **Jest** for automated testing. 
Continuous Integration (CI) is configured through GitHub Actions to automatically run all tests on every push or pull request.

---



Jest is used for all test files both frontend and backend which are named `__tests__/`.

Backend and Frontend Tests (Firebase Functions)
1. Navigate to the backend directory:
```
cd functions
npm install
Run all Jest tests:
npm test
```

---
# How to Add a New Test
Add or update the code you want to test under `functions/src/...` For example, if you create a new helper called formatInviteMessage in `functions/src/invites/formatInviteMessage.ts`, that’s the code you’ll be testing.

Create a new test file in `functions/__tests__/` with a matching purpose and a `.test.ts` suffix. 
For example: `functions/__tests__/formatInviteMessage.test.ts.`

In that test file, import the function(s) you want to verify from `functions/src/....`

Write Jest tests using `describe(...)`, `it(...)`, and `expect(...)`.

   
Include at least one “happy path” test (valid input returns the correct result).
Include at least one defensive/edge case test (bad/missing input is handled safely or rejected).
If the code has side effects (like recording a notification), assert on those effects.

From inside the functions/ directory, run:
```
npm install   # only needed the first time on a new machine
npm test      # runs all Jest tests locally
```


Make sure your new test passes locally.

Commit both:   
- the source file you added or modified in `functions/src/...`, and
- the new test file in `functions/__tests__/`.

Push your changes or open a pull request to main or develop. GitHub Actions (from `.github/workflows/ci-js.yml`) will automatically cd into `functions/`, run `npm install`, and execute all `.test.ts` files in `functions/__tests__/`. If your new test fails in CI, the PR/build will be marked as failed and can’t be merged until it’s fixed.

Keep tests independent — try not to rely on results from other tests.

Name tests after the feature or function (e.g., `ProfileValidation.test.ts`).

Use mocks for Firebase calls only when integration tests aren’t needed.

Commit your test with the corresponding feature update.
Keep all tests in `__test__`

---
# How to build a new release

Releasing Partner & Pump involves packaging both the Expo mobile client and Firebase backend into stable, versioned builds suitable for testing or publication to app stores.
Most of the process is automated through Expo’s build service and Firebase’s CLI tools, but several manual checks are still required.
Before starting a release, ensure that your local branch is up to date with the latest version of main. Each release should include a new version number in both the root package.json and app.json files. 

Once the version numbers have been updated, commit and push your changes. The Expo CLI handles the client build process. To create a release build, run the following command from the project root:





After deployment, test key endpoints (authentication, match creation, and profile updates) using EXPO to ensure stability.

Although most build and deployment steps are automated, developers should still perform manual quality assurance. This includes verifying that assets load correctly, API keys and environment variables are valid, and that version numbers in the documentation match the current release. 
The final check involves running through the app’s onboarding and matching flow to confirm there are no regressions before tagging the release.

When you are done with all the manual tests, add a tag to name the release:
```
git tag -a v1.0.0 -m "Partner & Pump v1.0.0 stable release"
git push origin v1.0.0
```
