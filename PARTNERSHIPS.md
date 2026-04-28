# gnhf Strategic Partnerships

## Partnership Strategy Overview

gnhf's value proposition is fundamentally tied to the agents it orchestrates. The stronger the integration with each agent, the better the experience for users, and the harder it becomes for competitors to replicate gnhf's position. Partnerships with agent providers are therefore not a nice-to-have -- they are a core strategic priority.

### Partnership Philosophy

gnhf takes a **neutral orchestration layer** stance. We do not pick favorites among agents. Every partnership must respect this neutrality:

- No exclusivity agreements. gnhf will always support multiple agents.
- No commercial revenue-sharing that creates incentive to steer users toward a specific agent.
- Partnerships are about **integration depth**, not commercial entanglement.
- All agent integrations remain open-source. Partnerships may produce co-developed code, documentation, or marketing -- never proprietary lock-in.

### What gnhf Offers Partners

1. **Distribution.** gnhf users are high-value agent users -- they run long, autonomous sessions that consume significant tokens. Every gnhf user is a power user of the underlying agent.
2. **Showcase for agent capabilities.** Overnight autonomous runs are the ultimate test of an agent's reliability. Strong performance in gnhf is a compelling proof point for agent providers.
3. **Feedback loop.** gnhf's structured output format, per-iteration logging, and success/failure tracking generate high-quality data about agent behavior in real-world autonomous scenarios. This is valuable feedback for agent improvement.
4. **Ecosystem credibility.** Being a supported gnhf agent signals that an agent is production-ready for autonomous use.

### What gnhf Needs from Partners

1. **Stable non-interactive APIs.** Reliable JSON/JSONL output modes, structured result schemas, and non-interactive execution flags.
2. **Token usage reporting.** Accurate input/output/cache token counts for budgeting and analytics.
3. **Early access to CLI changes.** Advance notice of breaking changes to CLI flags, output formats, or APIs.
4. **Co-marketing opportunities.** Joint blog posts, conference talks, and documentation references.
5. **Technical collaboration.** Shared bug fixes, performance optimizations, and feature co-development.

---

## Tier 1 Partners

Tier 1 partners are the agents with the largest user bases and the most strategic importance to gnhf's adoption. These partnerships should be pursued immediately and maintained as top priorities.

### Anthropic (Claude Code)

**Current Integration Status:** Fully supported. gnhf invokes `claude` directly in non-interactive mode with structured JSON output. Token usage (input, output, cache read, cache creation) is fully tracked. Process tree cleanup is handled after successful results.

**Partnership Value Proposition for Anthropic:**
- gnhf is one of the most sophisticated third-party orchestrators for Claude Code. Every gnhf user running `--agent claude` is a high-engagement Claude Code customer.
- Overnight autonomous runs showcase Claude Code's reliability and reasoning capability in ways that interactive sessions cannot. This is compelling marketing material.
- gnhf's structured feedback (success/failure per iteration, token usage, error categorization) provides Anthropic with real-world autonomous performance data.
- gnhf's open-source nature means Claude Code's non-interactive capabilities are well-documented and battle-tested by the community.

**Integration Depth Opportunities:**

| Level | Description | Timeline | Effort |
|---|---|---|---|
| **Current** | CLI wrapping with structured output parsing | Done | -- |
| **Level 2** | Direct API integration via Claude Code SDK (if/when available), eliminating process spawning overhead | 3-6 months | Medium |
| **Level 3** | Co-developed "orchestration mode" in Claude Code that exposes richer mid-iteration signals (progress, confidence, suggested next steps) | 6-12 months | High |
| **Level 4** | Joint multi-agent features: Claude Code as "architect" agent that generates plans, other agents as "implementers" | 12+ months | Very High |

**Outreach Plan:**
1. **Month 1:** Identify the Claude Code CLI team at Anthropic. Reach out via developer relations or direct engineering contacts.
2. **Month 1-2:** Share gnhf usage data (anonymized) showing Claude Code autonomous performance characteristics. Propose a joint blog post: "Running Claude Code Overnight with gnhf."
3. **Month 2-3:** Request early access to Claude Code CLI beta releases to ensure gnhf compatibility. Offer to be a beta testing partner.
4. **Month 3-6:** Propose deeper integration: a stable SDK or API for non-interactive orchestration that goes beyond CLI wrapping.
5. **Ongoing:** Maintain a shared Slack channel or regular sync for breaking changes, feature requests, and bug reports.

**Key Contact Strategy:** Anthropic has a developer relations team and an active community. Initial contact through the Claude Code GitHub repository (issues, discussions) and the Anthropic developer Discord. Escalate to direct engineering contact after establishing credibility through high-quality bug reports and integration documentation.

### OpenAI (Codex CLI)

**Current Integration Status:** Fully supported. gnhf invokes `codex exec` in non-interactive mode with `--output-schema` for structured results. OpenAI strict mode is handled (all properties in `required` when `additionalProperties: false`). Token usage is tracked.

**Partnership Value Proposition for OpenAI:**
- gnhf drives sustained, high-token-volume Codex usage. Overnight runs consume significantly more tokens than interactive sessions.
- gnhf's agent-agnostic positioning means Codex is constantly being compared against Claude Code and others. Strong Codex performance in gnhf becomes visible social proof.
- gnhf's structured output requirements (`--output-schema`) are a real-world stress test of Codex's structured output capabilities.

**Integration Depth Opportunities:**

| Level | Description | Timeline | Effort |
|---|---|---|---|
| **Current** | CLI wrapping with `codex exec` and `--output-schema` | Done | -- |
| **Level 2** | Direct API integration if Codex exposes a programmatic SDK beyond the CLI | 3-6 months | Medium |
| **Level 3** | Co-developed iteration-aware mode: Codex exposes mid-execution checkpoints that gnhf can use for more granular rollback | 6-12 months | High |
| **Level 4** | Model-specific optimizations: gnhf prompt templates tuned for Codex's strengths, with OpenAI's input on optimal prompting patterns | 6-9 months | Medium |

**Outreach Plan:**
1. **Month 1:** Engage with the Codex CLI team through GitHub issues and the OpenAI developer forum. File high-quality bug reports and feature requests.
2. **Month 2:** Propose a joint case study showing Codex performance in overnight autonomous runs via gnhf.
3. **Month 3-4:** Request partner-level access to Codex CLI roadmap and beta releases.
4. **Month 4-6:** Propose API-level integration for higher reliability than CLI wrapping.
5. **Ongoing:** Regular sync on CLI changes, token reporting accuracy, and structured output improvements.

### GitHub (Copilot CLI)

**Current Integration Status:** Fully supported. gnhf invokes `copilot` in non-interactive JSONL mode. Known limitation: Copilot currently exposes only assistant output tokens, not full input/cache token totals (tracked in GitHub issue #1152).

**Partnership Value Proposition for GitHub:**
- GitHub Copilot's expansion from inline suggestions to CLI-based autonomous coding is a strategic priority. gnhf provides a production-grade orchestration layer that makes Copilot CLI useful for real overnight work.
- gnhf integration gives Copilot CLI a compelling use case beyond simple one-shot commands: sustained, multi-iteration autonomous coding.
- GitHub's developer platform strategy (Copilot, Actions, Codespaces) could benefit from gnhf as a bridge between Copilot CLI and GitHub Actions for CI-like agent runs.

**Integration Depth Opportunities:**

| Level | Description | Timeline | Effort |
|---|---|---|---|
| **Current** | CLI wrapping with JSONL output parsing | Done | -- |
| **Level 2** | Full token usage reporting (resolve issue #1152 with GitHub's help) | 1-3 months | Low |
| **Level 3** | GitHub Actions integration: run gnhf as a GitHub Action step with Copilot CLI as the agent | 3-6 months | Medium |
| **Level 4** | Deep integration with GitHub's platform: auto-create PRs from gnhf branches, link runs to GitHub Issues, integrate with Copilot Workspace | 6-12 months | High |

**Outreach Plan:**
1. **Month 1:** Engage with the Copilot CLI team through the GitHub issue tracker. Reference issue #1152 as a concrete ask.
2. **Month 2:** Propose a joint blog post on GitHub's blog: "Running Copilot CLI Overnight with gnhf."
3. **Month 3:** Explore GitHub Actions integration as a co-development opportunity.
4. **Month 4-6:** Discuss deeper platform integration with GitHub's partnerships team.
5. **Ongoing:** Maintain compatibility with Copilot CLI updates and provide feedback on autonomous-mode capabilities.

---

## Tier 2 Partners

Tier 2 partners are emerging agents or platforms with smaller current user bases but significant strategic potential. These partnerships should be initiated after Tier 1 relationships are established, or opportunistically if the partner approaches gnhf first.

### Atlassian (Rovo Dev)

**Current Integration Status:** Fully supported. gnhf starts a local `acli rovodev serve` process automatically, managing the server lifecycle. Integration is via the Rovo Dev HTTP API.

**Partnership Value Proposition for Atlassian:**
- Rovo Dev is Atlassian's entry into the AI coding assistant space. gnhf provides immediate access to the autonomous orchestration use case without Atlassian having to build it.
- gnhf's support for Rovo Dev validates it as a "real" coding agent alongside Claude Code, Codex, and Copilot.
- Atlassian's enterprise customer base aligns well with gnhf's Enterprise tier (SSO, audit logs, compliance).

**Integration Opportunities:**
- Deeper Jira integration: gnhf could read objectives from Jira issues and update them with run results.
- Confluence integration: auto-publish run summaries and notes.md to Confluence pages.
- Bitbucket integration: auto-create PRs in Bitbucket from gnhf branches.

**Outreach Plan:**
1. **Month 2-3:** Reach out to Atlassian's Rovo Dev team through their developer community.
2. **Month 4:** Propose a joint webinar targeting Atlassian enterprise customers.
3. **Month 6+:** Explore deeper Jira/Confluence/Bitbucket integration as a co-development project.

### OpenCode

**Current Integration Status:** Fully supported. gnhf starts a local `opencode serve` process, creates per-run sessions, and applies blanket allow rules for non-interactive operation.

**Partnership Value Proposition:**
- OpenCode is an open-source project, making collaboration natural and lightweight.
- gnhf drives adoption of OpenCode by making it accessible for overnight autonomous runs.
- Joint community-building: both projects share an audience of developers who prefer open-source, CLI-first tools.

**Integration Opportunities:**
- Shared contributors and community events.
- Co-optimized server mode for long-running gnhf sessions.
- Joint documentation and getting-started guides.

**Outreach Plan:**
1. **Month 1-2:** Engage with OpenCode maintainers via GitHub. Propose cross-project documentation.
2. **Month 3:** Co-host a community event or Twitter Space on open-source AI coding tools.
3. **Ongoing:** Maintain close integration compatibility and shared bug fixes.

### Emerging Agents (Future Tier 2)

The AI coding agent landscape is evolving rapidly. gnhf should be prepared to integrate new agents as they emerge. Likely candidates include:

| Agent | Status | Notes |
|---|---|---|
| **Google (Jules / Gemini Code Assist)** | Not yet CLI-available | Monitor Google's developer tools announcements. Integrate when a non-interactive CLI or API becomes available. |
| **Amazon (Q Developer CLI)** | Early stage | AWS developer tools have a large enterprise user base. Monitor for non-interactive mode support. |
| **Sourcegraph (Cody)** | Active development | Strong code intelligence features. Monitor for CLI-based autonomous mode. |
| **Cursor / Windsurf** | IDE-first | Currently IDE-only. If they release CLI or API modes, integrate. |
| **Open-source agents (Aider, SWE-agent successors)** | Active | Natural community alignment. Lower partnership overhead since both parties are open-source. |

**Integration Readiness Criteria:**
Before integrating a new agent, it must meet these minimum requirements:
1. Non-interactive CLI or HTTP API execution mode
2. Structured output (JSON/JSONL) with success/failure indication
3. Token usage reporting (at minimum, output tokens)
4. Ability to operate in a specified working directory
5. Process lifecycle management (clean start, graceful shutdown)

---

## Integration Depth Levels

gnhf's agent integrations exist on a spectrum of depth. Deeper integration provides a better user experience but requires more partnership investment.

### Level 1: Basic CLI Wrapping

**What it is:** gnhf spawns the agent as a child process, passes arguments via CLI flags, and parses stdout/stderr for results.

**Characteristics:**
- No dependency on the agent beyond its CLI being installed
- Output parsing is fragile and dependent on CLI output format stability
- Limited mid-execution visibility (can only see what the agent prints)
- Process management is coarse-grained (start, wait, kill)

**Current agents at this level:** All five agents started here. Claude Code, Codex, and Copilot have matured beyond basic wrapping.

### Level 2: Structured API Integration

**What it is:** gnhf communicates with the agent via a well-defined API (HTTP, SDK, or structured CLI protocol) rather than parsing unstructured output.

**Characteristics:**
- Reliable structured output (JSON schemas, typed responses)
- Accurate token usage reporting
- Error categorization (agent failure vs. hard error)
- Still process-lifecycle-based but with richer signals

**Current agents approaching this level:** Rovo Dev (HTTP API), OpenCode (HTTP API with session management).

### Level 3: Co-Developed Orchestration Protocol

**What it is:** gnhf and the agent provider collaborate on an orchestration-aware protocol that exposes mid-iteration signals, checkpoints, and richer metadata.

**Characteristics:**
- Mid-iteration progress reporting (e.g., "analyzing codebase", "writing tests", "running validation")
- Checkpoint/resume within a single iteration (not just between iterations)
- Confidence signals ("I am 80% sure this change is correct")
- Suggested next objectives ("I completed the refactoring; the test suite should be updated next")
- Resource usage predictions ("This iteration will likely consume ~500K tokens")

**No agents at this level yet.** This requires active partnership and co-development.

### Level 4: Deep Platform Integration

**What it is:** gnhf integrates deeply with the agent provider's broader platform, not just the coding agent itself.

**Characteristics:**
- Integration with the provider's project management tools (GitHub Issues, Jira, Linear)
- Integration with the provider's CI/CD (GitHub Actions, Bitbucket Pipelines)
- Shared authentication and authorization
- Co-branded features or joint product offerings
- Possible revenue-sharing or commercial partnership

**This level is aspirational and should only be pursued with Tier 1 partners after Level 3 is established.**

---

## Partnership Outreach Plan and Timeline

### Month 1-2: Foundation

| Action | Owner | Target |
|---|---|---|
| Create partnership one-pager (PDF) summarizing gnhf, integration status, and partnership value proposition | Founder/CEO | All partners |
| Compile anonymized usage data showing agent distribution, run patterns, and token consumption | Engineering | All partners |
| Identify primary contacts at Anthropic, OpenAI, and GitHub | Founder/CEO | Tier 1 |
| File high-quality GitHub issues and feature requests on each agent's repository | Engineering | All partners |
| Publish a blog post: "How gnhf Orchestrates Five Coding Agents" with fair comparison data | DevRel | Public |

### Month 2-3: Initial Outreach

| Action | Owner | Target |
|---|---|---|
| Send partnership one-pager to identified contacts at Anthropic, OpenAI, GitHub | Founder/CEO | Tier 1 |
| Request introductory calls with each Tier 1 partner's developer relations or partnerships team | Founder/CEO | Tier 1 |
| Propose joint blog post or case study to each Tier 1 partner | DevRel | Tier 1 |
| Engage with Atlassian Rovo Dev and OpenCode communities | DevRel | Tier 2 |

### Month 3-6: Relationship Building

| Action | Owner | Target |
|---|---|---|
| Establish regular sync cadence with each Tier 1 partner (monthly or quarterly) | Founder/CEO | Tier 1 |
| Request early access / beta programs for CLI changes | Engineering | Tier 1 |
| Publish joint content (blog posts, webinars, conference co-presentations) | DevRel | Tier 1 |
| Begin Level 2 integration work where APIs are available | Engineering | All |
| Explore GitHub Actions integration with GitHub | Engineering | GitHub |

### Month 6-9: Deepening Partnerships

| Action | Owner | Target |
|---|---|---|
| Propose Level 3 co-development discussions with most receptive Tier 1 partner | Founder/CEO + Engineering | Best Tier 1 candidate |
| Establish formal partnership agreements (non-binding MOUs covering early access, co-marketing, integration support) | Founder/CEO | Tier 1 |
| Begin Tier 2 partnership outreach (Atlassian formal, emerging agents) | DevRel | Tier 2 |
| Present gnhf at agent provider developer conferences or community events | DevRel | All |

### Month 9-12: Scaling and Formalizing

| Action | Owner | Target |
|---|---|---|
| Formalize partnership agreements with commercial terms (for Enterprise tier co-selling, if applicable) | Founder/CEO | Tier 1 |
| Launch Level 3 integration with at least one Tier 1 partner | Engineering | Tier 1 |
| Integrate 1-2 new agents from the emerging agent pipeline | Engineering | Tier 2+ |
| Publish "gnhf Partnership Program" page on gnhf.dev with integration guides and partner benefits | DevRel | Public |
| Conduct first annual partner review: what worked, what did not, where to invest next year | Founder/CEO | All |

---

## Success Metrics for Partnerships

### Integration Quality Metrics

| Metric | Definition | Target |
|---|---|---|
| Agent-specific success rate | % of iterations that succeed, per agent | > 70% for all Tier 1 agents |
| Token reporting accuracy | Does the agent report accurate token counts? | 100% for Tier 1 agents |
| Integration test pass rate | Automated tests for each agent integration in CI | 100% at all times |
| Time to integrate CLI updates | Days between agent CLI release and gnhf compatibility update | < 7 days for Tier 1 |
| User-reported agent issues | GitHub issues filed against a specific agent integration | Trending down quarter-over-quarter |

### Partnership Relationship Metrics

| Metric | Definition | Target |
|---|---|---|
| Partner responsiveness | Average time to response on integration questions or bug reports | < 3 business days for Tier 1 |
| Joint content published | Blog posts, webinars, conference talks co-produced with partners | 2+ per Tier 1 partner per year |
| Early access participation | Are we receiving pre-release builds and roadmap updates? | Yes for all Tier 1 by Month 6 |
| Partner referrals | Users who discover gnhf through partner documentation or recommendations | Track and grow |
| Integration depth level | Current level (1-4) for each partner | Level 2+ for all Tier 1 by Month 12 |

### Business Impact Metrics

| Metric | Definition | Target |
|---|---|---|
| Agent distribution | % of gnhf runs per agent | No single agent > 60% (validates agent-agnostic positioning) |
| New agent adoption | When a new agent integration launches, % of users who try it within 30 days | > 10% |
| Partnership-driven installs | Users who install gnhf from partner documentation or co-marketing | Track and grow; target 20% of new installs by Month 12 |
| Enterprise deals influenced by partnerships | Enterprise contracts where a partner relationship was a factor | Track; target 30% by Month 18 |
| Partner satisfaction (NPS) | Annual survey of partner contacts | > 40 NPS |

---

## Partnership Risks and Mitigation

### Risk 1: Partner Builds Competing Orchestration

**Scenario:** Anthropic adds a `claude --loop` mode, or GitHub builds agent orchestration into Actions natively.

**Mitigation:**
- gnhf's agent-agnostic value proposition remains even if one agent adds built-in orchestration. Users who use multiple agents still need gnhf.
- Deepen partnerships with agents that do NOT build their own orchestration, creating a coalition of partners who benefit from gnhf's existence.
- If a partner builds competing features, publicly and graciously acknowledge them while emphasizing gnhf's cross-agent and team/enterprise capabilities.
- Accelerate the commercial layer (Pro/Enterprise) so gnhf's value extends beyond basic orchestration.

### Risk 2: Partner Breaks CLI Compatibility

**Scenario:** A partner releases a CLI update that changes flags, output format, or behavior, breaking gnhf's integration.

**Mitigation:**
- Automated integration tests in CI that run against the latest version of each agent CLI.
- Early access programs with Tier 1 partners to catch breaking changes before GA release.
- Abstraction layer in gnhf's codebase (already exists: `src/core/agents/types.ts`) that isolates agent-specific code.
- Fast-response commitment: break-fix patches for Tier 1 agent compatibility within 48 hours.

### Risk 3: Partner Requires Commercial Terms That Compromise Neutrality

**Scenario:** A partner offers favorable terms (funding, co-marketing) contingent on gnhf prioritizing their agent or deprioritizing competitors.

**Mitigation:**
- Partnership philosophy is documented and non-negotiable: no exclusivity, no steering, no proprietary lock-in.
- Decline any terms that would compromise agent-agnostic positioning, even if they are financially attractive in the short term.
- Transparency with the community: if a partnership has commercial terms, disclose them.

### Risk 4: Low Partner Engagement

**Scenario:** Partners are unresponsive or deprioritize gnhf integration.

**Mitigation:**
- Lead with value: share usage data, file high-quality bug reports, contribute to their open-source projects.
- Build integration quality regardless of partner engagement -- gnhf's agent integrations should be excellent even without active partnership.
- Focus partnership resources on the most responsive partners. Do not waste effort on partners who are not engaged.
- Use community pressure constructively: users who want better gnhf integration with a specific agent will also request it from the agent provider.

---

## Appendix: Partnership One-Pager Template

The following template should be customized for each partner and delivered as a 1-page PDF.

**gnhf + [Partner Name]: Better Together**

**What is gnhf?**
gnhf is an open-source, agent-agnostic orchestration layer for autonomous coding. It keeps coding agents running overnight, committing each successful iteration and rolling back failures. 10,000+ developers use gnhf to get more from their coding agents.

**How gnhf works with [Agent Name]:**
gnhf invokes [Agent Name] in non-interactive mode, passing structured prompts and parsing structured results. Each iteration produces a clean git commit, and failures are automatically rolled back. [Agent Name] users can run `gnhf --agent [name] "objective"` and wake up to a branch full of work.

**Why partner with gnhf?**
- **[X]% of gnhf users run [Agent Name]** -- we drive high-engagement usage of your product
- **Overnight autonomous runs** showcase [Agent Name]'s reliability in ways interactive sessions cannot
- **Structured performance data** from gnhf runs provides real-world feedback on [Agent Name]'s autonomous capabilities
- **Open-source credibility** -- gnhf is MIT-licensed and community-driven

**What we are looking for:**
1. Early access to CLI / API changes to maintain integration quality
2. Joint content (blog post, webinar, or conference talk)
3. Technical collaboration on deeper integration (structured APIs, mid-iteration signals)
4. A regular sync cadence (monthly or quarterly)

**Contact:** [founder email] | gnhf.dev | github.com/kunchenguid/gnhf
