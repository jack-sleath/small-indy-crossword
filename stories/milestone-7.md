Title: Polish and Production Readiness — visual refinement, accessibility, and QA

<details>
<summary>Original Spec</summary>

**Goal:** The app is visually polished, accessible, and ready for the private group to use.

**Tasks:**
- Refine visual design: typography, colours, animations (cell fill, win state)
- Ensure keyboard accessibility (focus indicators, logical tab order)
- Test and fix mobile keyboard edge cases (hidden input field approach if needed)
- Final cross-browser and cross-device QA (Chrome/Safari mobile, Chrome/Firefox desktop)
- Update README with usage instructions and how to update `pool.json`

**Done when:**
- [ ] All Acceptance Criteria are met
- [ ] App passes manual QA on Chrome/Safari mobile and Chrome/Firefox desktop
- [ ] README documents how to update puzzle content and deploy
- [ ] No console errors in production build

</details>


Technical Notes:
This milestone is primarily QA, polish, and documentation. No new functional features are added — existing behaviour from Milestones 1–6 is refined and hardened. Mobile keyboard edge cases may require a hidden `<input>` field to capture keypresses on touch devices without triggering the native keyboard in unexpected ways — **CONFIRM MOBILE INPUT STRATEGY** and flag for **MANUAL REVIEW** if the approach diverges from the hidden input pattern.


**GIVEN** a user opens the app on a mobile device (Chrome or Safari)
**WHEN** they tap a cell to begin solving
**THEN** the native mobile keyboard appears and letter input works correctly without layout-breaking behaviour

**GIVEN** a user is solving the puzzle using only a keyboard (no mouse)
**WHEN** they navigate through the grid and clue list
**THEN** visible focus indicators are present at all times and the tab order follows a logical sequence

**GIVEN** a user completes the puzzle
**WHEN** the win state animation plays
**THEN** the animation is smooth and does not cause layout shifts or visual glitches

**GIVEN** the production build is run (`npm run build`)
**WHEN** a developer opens the browser console on the deployed app
**THEN** no JavaScript errors or warnings are present

**GIVEN** a developer reads the README
**WHEN** they follow the instructions to update `pool.json` with new clue/answer pairs
**THEN** the instructions are clear and complete enough to do so without outside help

**GIVEN** a developer reads the README
**WHEN** they follow the deployment instructions
**THEN** they can successfully publish an updated build to GitHub Pages

**GIVEN** the app is tested on Chrome (desktop), Firefox (desktop), Chrome (mobile), and Safari (mobile)
**WHEN** a tester runs through all Acceptance Criteria on each browser/device combination
**THEN** all criteria pass with no browser-specific regressions
