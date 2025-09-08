# Phase 3 Prompt: Live Updates and Accuracy Visualization

Enhance MapPage with live updates and accuracy circle.

Tasks:
1) Add a "Locate Me" floating button on the map to re-fetch location and recenter.
2) Implement a watch (or timed polling) to update position periodically; clear on unmount.
3) Draw an accuracy circle around the user position using `coords.accuracy`.
4) Ensure errors are surfaced and do not break the page.

Validation:
- Pressing "Locate Me" recenters correctly.
- Position updates over time (watch/poll).
- Accuracy circle appears and scales sensibly.
- No memory leaks (watch cleared on unmount).
