# PIR Visuals 3.67 QA report

Validation used synthetic designer, portfolio and project fixtures on loopback MongoDB 8. The bot was never paired to WhatsApp. Testing used fixture OTPs, disabled SMTP, and checked the WhatsApp redirect without visiting the external destination.

| Check | Result |
| --- | --- |
| Frozen installs | Bot and website installed successfully on Node 24. Dependency audits returned zero reported vulnerabilities in both dependency trees at the time of testing. |
| Static | JavaScript syntax checks passed. PostCSS parsed 23 existing external stylesheets, the edition stylesheet and the shared shell stylesheet. The shell asset returned 304 when its ETag matched. |
| Website smoke | 9 of 9 checks passed, including MongoDB readiness, homepage, crawler endpoints, PWA assets, GSAP assets and Studio. |
| Playwright | 18 of 18 passed across desktop and mobile Chromium. The fixture profile test now verifies the existing contact redirect and checks the destination without contacting WhatsApp. |
| Responsive matrix | 162 checks passed across 18 routes at 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920 px. Each check inspected the HTTP status, the primary heading and document-level horizontal overflow. The last layout changes were followed by fresh desktop and mobile captures. |
| Visitor interactions | Search submission, category/location filtering and sort dispatch, persistent favorites and shortlist, direct contact redirect, dark appearance persistence and mobile navigation were exercised. |
| HTTP and MongoDB workflow | 33 checks passed, including seeded Studio login and OTP single use, upload, private preview, moderation, public case study, edit, fixture deletion, brief persistence without SMTP, invite confirmation and replay rejection, project access isolation, feedback, CSRF and logout. |
| Accessibility and motion | Automated axe WCAG checks reported zero violations on the tested light homepage, Discover, Studio login and case study after contrast and label fixes. The browser exercised reduced-motion rendering and observed the edition entrance with motion enabled. Full accessibility conformance was outside the coverage. |
| Response size | The decoded homepage HTML decreased from 433,735 bytes to 45,109 bytes, about 89.6%. The reusable CSS fetched separately. Timings varied under parallel browser load, and no Lighthouse or field Core Web Vitals score is claimed. |
| Visual evidence | Before and after viewport screenshots at 1440 and 390 px for 17 pages and workspace states. Authenticated Studio, owner dashboard, client project and designer project screenshots use synthetic fixtures. |

## Historical regression suites

| Suite | Baseline | Updated |
| --- | --- | --- |
| Bot Node suite | 697 passed, 1 failed | 697 passed, 1 failed |
| Website Node suite | 703 passed, 108 failed | 681 passed, 130 failed |

The bot baseline was rerun with dependencies available because the supplied root lockfile could not install as written. Its one failure asserts original v6.5 website release metadata against the supplied v3.66.0 manifest.

The website has 108 pre-existing failures. Twenty-two additional assertions failed after the update. They check the previous hero markup and decorative animation, the forced logo intro URL, nested category markup, pre-update crawler query and service-worker literals, and exact manifest/cache versions. These assertions were left intact. The updated Playwright and HTTP checks cover the corresponding current behavior where applicable. The Node suite remains a failing release gate.

## Production-equivalent coverage and remaining checks

- The normal Docker build in this cloud environment failed inside npm dependency installation, including a retry with proxy forwarding. An offline Node 22.23.5 QA image used the same version-locked packages from the verified npm cache. The image passed all nine smoke checks and shut down on SIGTERM. See the deployment guide for the normal build and review registry access on the production builder.
- A MongoDB dump of the isolated fixture database was restored into a separate namespace. Counts matched for profiles, portfolios, leads, client projects and project updates. The production volume snapshot and recovery sequence were outside this check.
- Live email delivery and WhatsApp registration, account linking, OTP delivery and notifications were not exercised. The disabled SMTP path still persisted the brief and displayed delivery failure accurately.
- Full production proxy/certificate validation, CDN cache purge, load testing, cross-browser coverage, every owner operation, every form permutation, keyboard and screen-reader conformance, and an exhaustive dark-theme audit were not executed.
- The two reference websites returned HTTP 403 in the cloud proxy. No direct viewport comparison with them was possible.
