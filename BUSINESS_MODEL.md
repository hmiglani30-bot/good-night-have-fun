# gnhf Business Model

## Executive Summary

gnhf ("good night, have fun") is an open-source, agent-agnostic orchestrator that keeps coding agents running autonomously while developers sleep. The business model follows an **open-core** approach: the CLI tool and its core orchestration engine remain fully open-source and free forever, while a commercial layer provides analytics, team collaboration, enterprise compliance, and premium support for organizations that depend on gnhf at scale.

The open-core model is the right fit for gnhf because:

1. **Trust is table stakes.** Developers will not hand overnight control of their codebase to a tool they cannot audit. The core must be open.
2. **Adoption drives value.** Every new user who integrates gnhf into their workflow creates demand for the features that only matter at organizational scale: dashboards, audit trails, team coordination, and uptime guarantees.
3. **The orchestration layer is sticky.** Once teams build processes around gnhf (nightly CI-like agent runs, multi-worktree pipelines, custom agent configs), switching costs are high. Monetization should align with the point where switching costs are highest: team and enterprise use.

The goal is to reach $1M ARR within 18 months of launching the Pro tier, primarily through self-serve Pro subscriptions and a small number of Enterprise contracts.

---

## Tier Definitions

### Free Tier (gnhf Open Source)

Everything that exists today, plus the ongoing open-source roadmap.

| Capability | Details |
|---|---|
| Core orchestrator | Autonomous loop with commit-per-iteration, rollback, retry, exponential backoff |
| All five agents | Claude Code, Codex, GitHub Copilot CLI, Rovo Dev, OpenCode |
| Worktree mode | Parallel agents on the same repo |
| Runtime caps | `--max-iterations`, `--max-tokens`, `--stop-when` |
| Resume support | Pick up where a previous run left off |
| Debug logs | JSONL logs per run for troubleshooting |
| Sleep prevention | Native OS-level sleep inhibition |
| Configuration | `~/.gnhf/config.yml`, custom agent paths, per-agent arg overrides |
| Community support | GitHub Issues, Discord community |
| License | MIT (current) |

**Rationale:** The free tier must be genuinely useful on its own. No artificial limitations. A solo developer should never feel like they are missing something essential. This maximizes adoption and word-of-mouth.

### Pro Tier ($29/month per seat)

For individual developers and small teams who want visibility, control, and reliability beyond what the CLI alone provides.

| Capability | Details |
|---|---|
| Analytics dashboard | Web-based dashboard showing run history, token spend over time, success/failure rates, commit throughput, cost-per-iteration breakdowns |
| Run comparison | Side-by-side diff of two runs against the same objective to measure prompt effectiveness |
| Token budget alerts | Configurable alerts (email, Slack, webhook) when spend approaches thresholds |
| Team workspaces | Shared configuration, shared prompt library, shared run history across a team |
| Prompt templates | Curated and community-contributed prompt templates for common objectives (refactoring, test generation, dependency upgrades, etc.) |
| Custom agent integrations | SDK and documentation for adding proprietary or internal agents beyond the five built-in ones |
| Priority GitHub support | Issues labeled `pro` triaged within 1 business day |
| Early access | Beta features and agent integrations available 2-4 weeks before GA |

**Pricing rationale:** $29/month is below the threshold where most developers can expense it without procurement approval. It is comparable to GitHub Copilot ($19/month individual) but reflects the higher-value proposition of autonomous overnight execution rather than inline suggestions.

### Enterprise Tier (Custom pricing, starting at $500/month)

For organizations that need compliance, governance, and operational guarantees.

| Capability | Details |
|---|---|
| SSO/SAML | Integration with Okta, Azure AD, Google Workspace, and other SAML 2.0 / OIDC providers |
| Audit logs | Immutable, exportable logs of every run: who triggered it, what prompt was used, what commits were produced, token spend, agent used |
| Role-based access control | Admin, developer, viewer roles with granular permissions over repos, agents, and configurations |
| SLA | 99.9% uptime for the dashboard and API; 4-hour response time for P1 support issues |
| Dedicated support | Named support engineer, private Slack channel, quarterly business reviews |
| On-premises deployment | Self-hosted dashboard and telemetry collector for air-gapped or regulated environments |
| Custom agent onboarding | Hands-on engineering support to integrate proprietary internal agents |
| Policy engine | Organization-wide rules: mandatory runtime caps, allowed agents, required branch naming, auto-PR creation |
| Volume discounts | Tiered pricing based on seat count (50+, 200+, 500+) |

**Pricing rationale:** Enterprise pricing starts at $500/month for up to 20 seats (~$25/seat) and scales with seat count and add-on modules (on-prem, custom integrations). Typical mid-market contract target: $15K-$50K ARR. Large enterprise target: $100K+ ARR.

---

## Revenue Projections

All projections assume the Pro tier launches 6 months after the strategy is finalized, and the Enterprise tier launches 3 months after Pro.

### Key Assumptions

| Metric | Conservative | Moderate | Aggressive |
|---|---|---|---|
| Monthly free-tier growth (after launch) | 500 new users/mo | 1,500 new users/mo | 4,000 new users/mo |
| Free-to-Pro conversion rate | 2% | 4% | 7% |
| Pro monthly churn | 5% | 3% | 2% |
| Enterprise contracts (Year 1) | 3 | 8 | 20 |
| Average Enterprise ACV | $20K | $35K | $60K |

### Year 1 ARR (12 months after Pro launch)

| Scenario | Pro ARR | Enterprise ARR | Total ARR |
|---|---|---|---|
| Conservative | $105K | $60K | $165K |
| Moderate | $435K | $280K | $715K |
| Aggressive | $1.2M | $1.2M | $2.4M |

### Year 2 ARR (24 months after Pro launch)

| Scenario | Pro ARR | Enterprise ARR | Total ARR |
|---|---|---|---|
| Conservative | $380K | $200K | $580K |
| Moderate | $1.4M | $800K | $2.2M |
| Aggressive | $4.5M | $3.5M | $8.0M |

### Unit Economics Target

| Metric | Target |
|---|---|
| CAC (Pro, self-serve) | < $50 |
| CAC (Enterprise) | < $5,000 |
| LTV:CAC ratio | > 3:1 |
| Pro payback period | < 2 months |
| Gross margin | > 85% (SaaS dashboard + support costs only) |

---

## Competitive Landscape

### Direct Competitors

| Product | Description | Strengths | Weaknesses vs. gnhf |
|---|---|---|---|
| **ralph (ghuntley)** | Original concept for autonomous agent loops | First-mover mindshare in the concept space | No maintained OSS implementation; more of a philosophy than a product |
| **autoresearch (karpathy)** | Autonomous research loop | Strong brand association (Karpathy) | Research-focused, not a general coding orchestrator |
| **aider** | AI pair programming in the terminal | Large community, strong edit/apply model | Synchronous pair-programming model, not designed for overnight autonomy |
| **SWE-agent** | Autonomous software engineering agent | Academic credibility, benchmarks | Single-agent, research-oriented, not a production orchestrator |
| **Devin** | Fully autonomous AI software engineer | Strong funding, end-to-end autonomy | Closed-source, expensive, opaque; gnhf is transparent and agent-agnostic |

### Adjacent Products (Potential Future Competitors)

| Product | Risk Level | Notes |
|---|---|---|
| Agent providers themselves (Anthropic, OpenAI, GitHub) | High | Could build orchestration into their own CLIs; mitigated by gnhf being agent-agnostic |
| CI/CD platforms (GitHub Actions, GitLab CI) | Medium | Could add "agent step" to pipelines; gnhf is more developer-centric and local-first |
| IDE extensions (Cursor, Windsurf) | Medium | Currently synchronous; could add background modes; gnhf is IDE-independent |

### Competitive Moat

1. **Agent-agnostic by design.** gnhf is the Switzerland of agent orchestration. No vendor lock-in.
2. **Open-source trust.** Developers can audit every line of code that touches their repo overnight.
3. **Production-hardened.** Commit-per-iteration, rollback, exponential backoff, worktree isolation -- gnhf is built for real-world reliability, not demos.
4. **Community and ecosystem.** Prompt templates, custom agent SDK, and integrations create network effects.
5. **First-mover in the orchestration layer.** gnhf already supports five agents. As new agents emerge, gnhf is the natural place to integrate them.

---

## Go-to-Market Strategy

### Phase 1: Community Growth (Months 0-6)

**Objective:** Reach 10,000 active users (weekly CLI invocations).

| Channel | Tactic |
|---|---|
| GitHub | Star campaigns, contributor onboarding, sponsor badges, "good first issue" labels |
| Twitter/X | Developer threads showing overnight results (before/after branch diffs), engagement with AI coding community |
| Discord | Active community with channels for each agent, prompt sharing, run showcases |
| Hacker News / Reddit | Launch posts, Show HN, targeted r/programming and r/ExperiencedDevs posts |
| Conference talks | Lightning talks at local meetups; proposals for AI/DevTools tracks at major conferences |
| Content marketing | Blog posts: "How I refactored 10K lines overnight", "gnhf vs. manual agent sessions", agent comparison guides |
| Developer Relations | Partnerships with developer YouTubers and newsletter authors for reviews |

### Phase 2: Pro Launch (Months 6-9)

**Objective:** 200 paying Pro subscribers by end of Month 9.

| Tactic | Details |
|---|---|
| Waitlist and early access | Build anticipation with a waitlist; offer early access to top community contributors |
| Freemium hook | Show aggregated stats in the CLI ("You've saved ~40 hours this month. See detailed analytics at gnhf.dev/dashboard") |
| Self-serve billing | Stripe-based, no sales calls needed |
| Content | Case studies from early adopters, ROI calculators |
| Referral program | 1 month free for every referral that converts |

### Phase 3: Enterprise Launch (Months 9-15)

**Objective:** Close 5 Enterprise contracts by end of Month 15.

| Tactic | Details |
|---|---|
| Outbound sales | Identify companies with 50+ engineers already using gnhf (telemetry opt-in) |
| Security/compliance content | SOC 2 readiness blog post, security whitepaper, architecture docs for on-prem |
| Partnerships | Joint webinars with agent providers (Anthropic, OpenAI) targeting their enterprise customers |
| Conference sponsorships | Sponsor developer conferences with strong enterprise attendance |

---

## Key Metrics to Track

### Adoption Metrics

| Metric | Definition | Target (Month 12) |
|---|---|---|
| Total installs (npm) | Cumulative `npm install -g gnhf` | 50,000 |
| Weekly active users | Unique users who ran gnhf at least once in the past 7 days | 5,000 |
| GitHub stars | Repository stars | 8,000 |
| Discord members | Total Discord server members | 3,000 |
| Agent distribution | % of runs per agent (Claude, Codex, Copilot, Rovo Dev, OpenCode) | Track, no target |
| Average iterations per run | Mean number of iterations before a run completes or is stopped | Track, no target |

### Conversion Metrics

| Metric | Definition | Target |
|---|---|---|
| Free-to-Pro conversion | % of WAU who become paying Pro subscribers | 4% |
| Trial-to-paid conversion | % of Pro trial users who convert after trial | 60% |
| Pro-to-Enterprise upgrade | % of teams on Pro who upgrade to Enterprise | 5% annually |
| Time to first payment | Days from first gnhf invocation to Pro subscription | < 30 days |

### Retention Metrics

| Metric | Definition | Target |
|---|---|---|
| Pro monthly churn | % of Pro subscribers who cancel in a given month | < 4% |
| Enterprise annual churn | % of Enterprise contracts not renewed | < 10% |
| Net Revenue Retention (NRR) | Revenue from existing customers including expansion | > 110% |
| DAU/MAU ratio | Daily active / monthly active users | > 30% |

### Product Health Metrics

| Metric | Definition | Target |
|---|---|---|
| Run success rate | % of iterations that result in a successful commit | > 70% |
| Mean time per iteration | Average wall-clock time for a single agent iteration | Track, no target |
| Token efficiency | Commits per 1M tokens consumed | Track, improve over time |
| Agent error rate | % of runs that end due to hard agent errors (not agent-reported failures) | < 5% |

---

## Risks and Mitigation Strategies

### Risk 1: Agent Providers Build Their Own Orchestration

**Severity:** High
**Probability:** Medium

If Anthropic adds a `claude --loop` flag or OpenAI adds autonomous mode to Codex, gnhf's value proposition weakens for single-agent users.

**Mitigation:**
- Double down on agent-agnostic positioning. gnhf's value is that it works with ALL agents and lets you switch freely.
- Build features that no single agent provider will: cross-agent analytics, team collaboration, prompt libraries that work across agents.
- Pursue partnerships so gnhf is the *recommended* orchestration layer (see PARTNERSHIPS.md).
- Move up the stack: multi-agent coordination (run Claude for architecture, Codex for implementation, Copilot for tests -- in sequence or parallel).

### Risk 2: Open-Source Sustainability

**Severity:** Medium
**Probability:** Medium

Maintaining a high-quality open-source project with a small team is expensive. Contributor fatigue, support burden, and feature requests can overwhelm.

**Mitigation:**
- Pro and Enterprise revenue funds full-time maintainers (target: 2 FTEs by Month 12).
- Clear contribution guidelines (CONTRIBUTING.md already exists) and a strong community of external contributors.
- GitHub Sponsors and corporate sponsorship for the open-source project itself.
- Ruthless prioritization: the core CLI stays lean. Complexity goes into the commercial layer.

### Risk 3: Low Free-to-Pro Conversion

**Severity:** Medium
**Probability:** Medium

Developers are notoriously resistant to paying for tools, especially when the free tier is generous.

**Mitigation:**
- The Pro tier must deliver obvious, measurable value. The analytics dashboard should answer "how much money did my overnight runs save me?" with a dollar figure.
- Token budget alerts prevent bill shock from agent providers -- saving users money is a strong value proposition.
- Team features create organizational pressure to adopt Pro (shared configs, shared prompt libraries, visibility for managers).
- Consider usage-based pricing as an alternative if flat-rate conversion is too low.

### Risk 4: Security and Trust Concerns

**Severity:** High
**Probability:** Low-Medium

Developers may be reluctant to run agents autonomously overnight, especially on production-adjacent code.

**Mitigation:**
- gnhf already commits per-iteration and rolls back failures -- emphasize this in messaging.
- Worktree mode ensures the main branch is never touched.
- Enterprise policy engine allows organizations to set guardrails (mandatory caps, allowed agents, branch protection).
- Publish a security model document explaining exactly what gnhf does and does not do.
- Consider an optional "dry run" mode that shows what would have been committed without actually committing.

### Risk 5: Market Timing

**Severity:** Medium
**Probability:** Low

The autonomous coding agent market is nascent. If agents do not improve fast enough, the "run overnight" use case may not be compelling enough.

**Mitigation:**
- gnhf already works today with current-generation agents. The value proposition improves as agents get better -- gnhf rides the improvement curve without having to create it.
- Focus marketing on concrete, achievable objectives: "refactor this module", "add tests for these files", "update all dependencies" -- tasks that current agents handle well.
- Track and publish success rate data to build confidence.

### Risk 6: Pricing Pressure from Free Alternatives

**Severity:** Low-Medium
**Probability:** Medium

Other open-source projects may replicate gnhf's orchestration model without a commercial layer.

**Mitigation:**
- Speed of execution. gnhf is already the most mature option in this space.
- Community and ecosystem moats (prompt templates, agent integrations, contributor base).
- The commercial layer (dashboard, team features, enterprise compliance) is hard to replicate as an open-source side project.

---

## Financial Model Summary

| | Year 1 (Moderate) | Year 2 (Moderate) |
|---|---|---|
| **Revenue** | $715K | $2.2M |
| **COGS** (hosting, infrastructure) | $70K | $180K |
| **Gross Profit** | $645K | $2.0M |
| **Operating Expenses** | | |
| Engineering (3 FTEs) | $450K | $600K |
| Sales & Marketing | $100K | $250K |
| G&A | $50K | $80K |
| **Operating Income** | $45K | $1.07M |
| **Gross Margin** | 90% | 91% |
| **Operating Margin** | 6% | 49% |

The business becomes cash-flow positive in Year 1 under the moderate scenario. Under the conservative scenario, break-even occurs in Month 18.

---

## Decision Points and Next Steps

1. **Validate pricing:** Survey existing gnhf users on willingness to pay for Pro features. Target: 100 responses within 4 weeks.
2. **Build analytics telemetry:** Add opt-in, anonymous usage telemetry to the CLI to understand adoption patterns. Ship within 6 weeks.
3. **MVP dashboard:** Build a minimal analytics dashboard (run history, token spend chart, success rate) to validate the Pro value proposition. Target: 8 weeks.
4. **Legal/licensing review:** Confirm MIT license is compatible with the open-core model. Evaluate CLA requirements for contributors.
5. **Hire first DevRel:** A developer advocate who can write, speak, and code is the single highest-leverage hire for Phase 1.
