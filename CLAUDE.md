# Project Guidelines

## Design System

- Use shadcn/ui + Tailwind CSS + Radix UI for all UI components
- The design system lives in `libs/ui` — all shared components belong there
- Do not install or use alternative component libraries unless nessessary

## Firebase

- Do NOT use the Firebase Web SDK for data operations (reads, writes)
- All Firebase operations must go through the NestJS API (`apps/api`)
- Exception: Firestore real-time listeners may use the Firebase Web SDK directly in the frontend for live updates
- Always use production Firestore — do NOT use Firebase emulators
