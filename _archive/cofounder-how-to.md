# Cofounder — How to Run a Company
Source: https://cofounder.co/how-to/

---

# Chapter I — How To Start A Company

Great companies usually start with a simple belief: something should exist that does not exist yet.

At zero, you do not need a perfect plan, a team, funding, or a polished product. You need a problem worth exploring, a customer you can learn from, and enough momentum to take the next step.

## Should You Start a Company?

Everyone should try to start a company at some point in their lives. It's hard, takes a while to pay off, and sometimes comes with significant risks. But you end up with something you built yourself. The real question is whether it's the right time for you to make an attempt.

A good starting point is if:
- You have seen a painful problem up close.
- You understand a customer or industry better than most people.
- You have access to a market other founders cannot easily reach.
- A new technology makes something possible that was not possible before.
- You keep coming back to the same problem even after trying to ignore it.

## How to Come Up With Startup Ideas

Startup ideas can come from many places. Most good ones start with a problem.

A problem gives you something real to test. If people already feel pain, already spend money, already use awkward workarounds, or already complain about the current options, you have signal.

Most startup ideas come from three sources:

**Problems you understand**
- Best source: a problem from your previous work. You were inside a company or industry, watched people struggle with the same workflow over and over, and realized the current tools were not good enough.
- Second source: your personal life. You notice an annoyance in the world and wonder why it has not been fixed.
- Third source: customer research. You pick a market, interview dozens of people, and look for repeated problems. People are not always good at articulating their own problems — they describe symptoms, not causes.

**New technology**
The iPhone created the mobile app boom. Cloud infrastructure made it easier to start software companies without buying servers. Modern AI is creating new ways to build, search, automate, generate, and interact with software.

"We are using AI" is not a startup idea. "We help paralegals review discovery documents in half the time" might be. The technology is the unlock, not the reason customers care.

A useful question: what became newly possible that customers already wanted?

**Specific opportunities**
Some startup ideas come from a specific opportunity you have unusual access to — your family, job, location, relationships, or reputation. This is called alpha. Use alpha as a wedge to build something durable.

## Evaluate Startup Ideas

Evaluate the idea critically across four lenses:

**Market Size** — The market should be big already or small but likely to become huge. A big existing market means people already spend money in the category — demand is proven. Do not choose a market solely because it is large. A market is useful when you can identify a reachable customer with a painful problem and a budget.

**Founder/Market Fit** — Means you are able to understand and serve the market. Maybe you worked in the industry. Maybe you are the customer. Maybe you understand the culture and constraints of the buyer better than outsiders do.

**Pain** — The best startup ideas solve painful problems. Pain means the customer already cares — they are losing money, wasting time, missing opportunities, taking on risk, or bound by a workflow they hate. A good test: what does the customer do today because your product does not exist, and would they pay you to fix it? Workarounds are evidence of demand.

**Unique Insight** — Something you believe that most people in the market have not realized yet. Without a unique insight, you are probably entering the market the same way everyone else sees it.

Positive signals:
- You are building something you personally want.
- It only recently became possible.
- There are successful analogs elsewhere.
- Customers already hacked together a solution.
- The market pulls the product from you.

Common mistakes:
- Avoiding ideas that seem too hard.
- Avoiding boring industries (logistics, insurance, construction, compliance, accounting, healthcare admin, manufacturing, legal workflows).
- Being too afraid of competitors. Competition usually means the problem exists.
- Waiting for the perfect idea.

## Pick a Wedge Market

A good early market has:
- The customer is easy to describe.
- The pain is frequent or expensive.
- The buyer has budget.
- You can reach customers without needing a giant sales team.
- The current alternatives are bad, expensive, slow, or outdated.
- The market is changing in a way that creates an opening.

Start narrow. Do not say your customer is "small businesses." Say your customer is "independent dental practices with three to ten locations that struggle with insurance claim denials." Specificity helps you build, sell, and learn.

**Cofounder feature:** Works with you to define your ICP when you get started — helping you narrow down to a specific, reachable customer segment before you write a single line of code.

## Pick a Name and Domain

Rules:
- Avoid names people cannot spell after hearing once.
- Avoid names that lock you into a tiny feature.
- Avoid names that sound too similar to existing companies.
- Avoid cleverness that only makes sense after an explanation.
- Check basic trademark risk before you get attached.
- Make sure you can get a reasonable domain and social handles.

Domain options: .com ideal, or .co, .app, .io, .ai, .dev. Do not use other TLDs — they rank lower and confuse customers. Startups will sometimes add "try" or "use" to the beginning of a common domain name.

**Cofounder feature:** Can buy a domain and configure it correctly — DNS, SSL, and all.

## Take the Leap

The beginning of a company should turn uncertainty into motion. Do not try to solve the next five years. Solve the next week. Start the company.

**Cofounder feature:** Has a roadmap on starting a tech company — a step-by-step guide from zero to your first deployed product, with the tools to execute each step.

---

# Chapter II — How To Build A Product

Setting up an engineering department is more than just writing code. You need architecture, a database, infrastructure, testing, design, deployment, and a plan to keep it all running as you grow.

## Come up with a spec

Before you write a single line of code, you need a plan: a clear, minimal specification of what your product does and who it's for.

To define your MVP, answer three questions:
1. What is the core problem you're solving? (Be ruthlessly specific.)
2. What is the minimum set of features needed to solve that problem? (List every feature, then cut half.)
3. What platform are you building for? (Web, mobile, or desktop? For most startups, start with web.)

**Cofounder feature:** Use Plan Mode in Cofounder to come up with a product plan. Cofounder currently supports web applications.

## Create a repository

Your code needs a home: a Git repository, hosted on GitHub.

Setting up a repository involves:
- Initialize the repo with a sensible folder structure for your chosen tech stack.
- Set up branch protection on your main branch.
- Configure a README.
- Add a .gitignore so you don't accidentally commit secrets, node_modules, or other garbage.

## Set Up Deployments

Set up deployment before you start coding. By setting up deployment first, every change you make is immediately visible in a real environment.

Recommended: **Vercel** for deployment. Built for modern web frameworks (especially Next.js), handles scaling automatically.

Three environments:
1. **Development** — local machine or preview environments (with Cofounder, you can skip local dev entirely)
2. **Staging** — mirrors production, connected to your main development branch
3. **Production** — live environment your users see

Preview environments: Vercel creates a unique URL for every branch/PR — you can see exactly what agents built, click through it, and decide whether to merge.

## Secret Management

Never hardcode API keys, database connection strings, or auth secrets in your codebase.

Rules:
- Never commit .env files. Add to .gitignore immediately.
- Use different secrets per environment.
- Rotate secrets periodically.
- Limit access.

**Cofounder feature:** Includes built-in secrets management, secured via Vercel.

## Scaffold Your App

Tech stack recommendation:
- **Next.js** — frontend and API layer. Both pages and server-side logic in a single project. Built on React.
- **Supabase** — database (PostgreSQL), authentication, and file storage.

Cost: GitHub free for private repos. Supabase free tier covers dev and early users ($25/month when you need more). Vercel + Supabase can run a production app for under $50/month until meaningful traffic.

## The Backend

Four things your backend needs at minimum:

**Authentication** — Do not build your own auth system. Use Supabase Auth. Supports email/password, magic links, social login (Google, GitHub, Apple). Integrates with row-level security.

**A Database** — Supabase gives you PostgreSQL. Think carefully about your data structure early. Schema changes require migrations after launch — a botched migration on production is one of the worst situations you can be in.

**An API Layer** — In Next.js, define these directly in your project. Handles loading data, saving form submissions, running business logic, talking to third-party services.

**Third-Party Integrations:**
- Payments: **Stripe** (2.9% + 30¢ per transaction). Set up webhooks to listen for payment events.
- Transactional email: **Postmark** (fast, reliable, excellent deliverability, free tier dev, $15/month for 10k emails).

**Security:**
- Only send users the data they need.
- Don't trust anything from the browser — always double-check on the server.
- Use Supabase row-level security.
- Keep secrets out of codebase.
- Use HTTPS everywhere (Vercel handles this).

**Cofounder feature:** Sets up Supabase Auth integration, database schema with row-level security, environment variable management, and secure API route patterns.

## The Frontend

Frontend development in 2026 is primarily TypeScript using React (Next.js). AI agents excel at translating designs and user flows into working UI code.

You need to deeply understand your UX and business logic:
- What are the core user flows?
- What happens at each step? What data is displayed? What actions can the user take? What are the edge cases?
- What does it look like? (Wireframes or rough sketches are fine.)

**Design Without Designers** — In 2026, agents can design directly in code. Describe what you want and the agent builds a working version immediately. The artifact you produce is working code, not a Figma file.

Frontend loop:
1. Test the app — click through the real flow
2. Find odd parts — confusing copy, dead ends, awkward states
3. Fix and repeat — ship the smallest useful improvement

**Cofounder feature:** Enable instant edits by commenting to the agent. Can build entire pages and components from descriptions, wireframes, or reference screenshots.

## Deploy to Production

Steps:
1. Quickly test in preview environments
2. Test thoroughly in staging
3. Merge to main (via pull request)
4. Deploy (Vercel automatically deploys main to production)
5. Verify in production

For long-running background processes (batch emails, file processing, multi-step AI pipelines): use **Vercel Workflows**. Handles retries, picks up where it left off if interrupted.

## Testing and Quality: Avoiding AI Slop

AI-generated code can be mediocre — verbose, poorly structured, with subtle issues. The industry term: AI slop.

Test types:
- **Unit tests** — verify individual functions in isolation
- **Integration tests** — verify multiple parts work together
- **End-to-end (E2E) tests** — simulate real user interactions

Warning: When agents write tests, verify they actually test something meaningful. Common failure: tests that are circular ("does this code do what this code does?") rather than "does this code do what the user needs?"

**Linting and Formatting:** ESLint (catches bugs) + Prettier (keeps formatting consistent). Set to run automatically on save or commit.

**Agent Rules Files:** agents.md or .cursorrules in your repo root. Include:
- Tech stack and versions
- Coding conventions (naming, file structure, import patterns)
- Which libraries to use (and not use)
- Examples of well-written code
- Common pitfalls specific to your codebase

**Cofounder feature:** Uses browser agents to test your app autonomously — navigate like a real user, test edge cases, generate a video of changes tested.

## Debugging in Production

Where to look:
- **Vercel logs** — API routes and serverless functions, real-time errors
- **Supabase logs** — database queries, auth events, database errors
- **Browser developer tools** — Console tab (JavaScript errors), Network tab (requests)
- **Sentry** — automatic error capture, grouped by similarity

Most bugs: a typo, a missing environment variable, an API that changed its response format, or a database query that doesn't account for a new edge case.

## Infrastructure Management

**Scaling your database:**
- Slow data lookups → add indexes
- Storage growth → set up data retention policies
- Too many simultaneous users → may need Supabase plan upgrade

**Scaling compute:**
- Vercel handles frontend and API scaling automatically
- Cache aggressively — serve pre-built pages instead of regenerating
- Rate limit your APIs
- Monitor usage (billing alerts in Vercel)
- Optimize functions (shorter execution = lower costs)

Early on: optimize for speed, not infrastructure cost. As you scale, efficiency becomes critical.

---

# Chapter III — How To Sell To Customers

Distribution is everything. You need a brand, a website, a sales process, and a way to create demand over time.

Sales and marketing are the two sides of distribution. Marketing helps people discover you. Sales turns the right people into customers.

**Cofounder feature:** Can help set up your sales and marketing department — define ICP, build website, configure CRM, create outreach workflows, plan content, generate marketing assets, turn customer conversations back into product feedback.

## Build a Brand

A brand is not just a logo. It is the story people attach to your company.

A brand has three parts:
1. **The story of the company** — why does the company exist?
2. **A set of values** — what do you believe that should show up in the product?
3. **A visual identity** — what does the company look and feel like?

**The story** — Start with why. Your brand values should not sound like corporate posters. They should shape product and marketing decisions.

Examples of brand values:
- Nike: Sport should move the world forward and be accessible to everyone.
- Airbnb: Travel should help people feel like they belong anywhere.
- Patagonia: A company can build great products while putting the planet first.
- Stripe: The internet should make it easier for more businesses to participate in the global economy.
- Shopify: Anyone, anywhere should be able to start and grow a business.
- Apple: Privacy should be built into products because it is a fundamental human right.

**Visual identity elements:** logo, color palette, fonts, button and layout styles, image/illustration/screenshot style, rules for how everything looks together.

## Build a Website

Your website should answer:
- Who is this for?
- What painful problem does it solve?
- What does the product do?
- Why is this better than the current way?
- What should the visitor do next?

For a live product: Sign up, Book a demo, or Log in. Earlier: Join the waitlist or Talk to us.

For a software company, it should convert readers into signups (self-serve) or demos (enterprise).

## Get Your First User

Start with people close enough to give real feedback. Do not just send a link and ask "What do you think?" — watch them use the product.

You are trying to learn:
- Do they understand what the product is for? (Watch for confusion in first 60 seconds)
- Can they reach the first valuable moment? (Count steps to first real value)
- Where do they get confused? (Note every hesitation, misclick, misread label)
- What would make them use it again? (Retention starts on day one)
- Would they pay for it? (A polite "maybe" is a no)
- Who else has this problem? (First lead list)

Take feedback seriously, but do not obey every request. Users are good at revealing problems. They are not always good at designing the solution.

## Define Your Ideal Customer

You need an Ideal Customer Profile (ICP) — the highly specific kind of customer you are trying to sell to first.

Too broad: "We sell to ecommerce companies."
Specific: "We sell to DTC brands doing $5M–$50M in revenue that rely on repeat purchases and have a small retention team."

To define your ICP: start with the broad category, then narrow by company size, industry, growth stage, geography, workflow, budget, and trigger event. A trigger event is something that makes the problem urgent: a company just raised money, a new leader joined, a team is hiring, a regulation changed.

## Understand Your Competitors

Competitors are proof that customers already care about the problem. The mistake is copying them.

Look at:
- Who their homepage speaks to
- What pain they lead with
- Which features they highlight
- What industries they mention
- How they price
- What their reviews complain about

Then ask: what are they missing? That gap is where you should position yourself.

## Choose Your Sales Motion

Three questions:
1. **Transactional or consultative?** — Low price/low trust = transactional; high price/complex = consultative
2. **Product-led or relationship-led?** — Product experience vs. trust
3. **Inbound or outbound?** — Most startups are outbound first because nobody knows they exist yet

Simple rule:
- Cheap, obvious, low-risk products → self-serve and product-led
- Expensive, complex, high-trust products → consultative sales
- Nobody knows you exist yet → outbound

Sales motion matrix:
- Buyers searching + simple product → Product-Led Inbound
- Buyers searching + complex product → Sales-Assisted Inbound
- Buyers not looking + simple product → Low-Touch Outbound
- Buyers not looking + complex product → Founder-Led Consultative

## Set Up the Sales Workflow

**Simple CRM:** Track who you're selling to, decision maker, deal stage, last discussion, follow-up date, win/loss reasons.

**Outbound cadence (7-day sequence):**
- Day 1: Email — context, problem, solve
- Day 2: Social touch — become familiar
- Day 3: Email — answer the likely objection
- Day 4: Social touch — show real engagement
- Day 5: Email — share the differentiator
- Day 6: Connection/DM — make it relevant
- Day 7: Email — soft walkaway
- Run the sequence up to 3x with different decision makers
- After a month, use their news. After two, restart the cadence.

**Inbox warmup:** New domains have no reputation. Ramp volume slowly:
- Configure SPF, DKIM, and DMARC
- Send small number of targeted emails first
- Ramp: Day 1 = 2 emails, Day 2 = 3, etc.
- Keep bounce rates low

**Lead list scoring:**
- Tier 1: Strong ICP fit, clear trigger, likely to buy soon
- Tier 2: Good ICP fit, some signal
- Tier 3: Possible fit, unclear need or long cycle

**Good outreach:** Casual, clear, concise, contextual. Reference a trigger, name a problem, say what the product does, ask for a small next step.

Bad: "I hope this email finds you well. Our revolutionary platform..."
Good: "Michael — saw your team is hiring three lifecycle marketers. Usually that means retention is becoming a bigger priority... Worth a quick look next week?"

## Run the Sales Process

**Pipeline stages:**
1. Open — lead added
2. Trying to Contact — outreach started
3. Contacted — prospect replied
4. Consult — discovery call scheduled or completed
5. Pitch — presented specific solution or proposal
6. Verbal Commit — buyer agreed in principle
7. Closed Won — contract signed or payment received
8. Closed Lost — deal is not moving forward

**Consult call:** Listen for pain, urgency, authority, budget, and fit. Questions: What problem? Why now? How do they handle it today? What's broken? What happens if they do nothing? Who else is involved? What would success look like?

**Pitch structure:**
1. Here is what we heard (repeat customer's problem in their language)
2. Here is why it matters (connect pain to time, money, risk)
3. Here is what changes (show the better outcome)
4. Here is how the product helps
5. Here is proof (examples, testimonials, data, demo)
6. Here is the next step

Talk about outcomes more than features.

**Close:** Make sure you have a clear price, scope, buyer, approval process, timeline, onboarding plan, and next meeting/signature date.

Not a close: "Let me know what you think."
A close: "Can we send the order form today and schedule onboarding for next Tuesday?"

## Improve the Sales Process

Review pipeline conversion monthly:
- Leads → contacted: list, copy, sending setup
- Contacted → consult: message relevance
- Consult → pitch: right ICP, real pain
- Pitch → verbal commit: story and offer strength
- Verbal commit → closed won: pricing, procurement, trust, onboarding

## How to do Marketing

Marketing creates awareness and generates warm leads. Sales converts those leads into customers.

**Content types:**
- Essays or blog posts
- Images and social posts
- Short videos
- Educational guides
- Templates and checklists
- Product demos
- Customer stories
- Benchmark reports
- Micro-apps — small free tools that solve a narrow problem

**Making content:** Most startup content is bad because it is rushed, generic, or written for no one in particular. One useful guide that says something specific is better than ten vague posts about "the future of work." Good content has one clear idea.

AI tools for assets: image models (gpt-image-2), Midjourney, HyperFrames (motion video), HTML for social assets.

**Marketing channels:**
- SEO: works when customers are already searching. Slow, but compounds.
- Paid: works when you know who the buyer is and can afford to test. Fast feedback, can burn money.
- Organic: works when your market spends time on social/communities/newsletters. Builds trust, requires consistency.
- Influencer/partnership: borrow trust from people with your audience.

Pick one primary channel and one supporting channel. Run them seriously for long enough to learn.

**Measure:**
- Which content gets attention?
- Which content brings qualified visitors?
- Which visitors become leads?
- Which leads become meetings?
- Which meetings become customers?

## Tell a Consistent Story

The customer is the main character, not you.

A simple story has five parts:
1. The customer has a goal.
2. Something is getting in the way.
3. The old way is no longer good enough.
4. Your product creates a better path.
5. The customer gets a better outcome.

This story should show up everywhere: website, outreach, consult calls, pitch, demo, proposal, content, ads, and onboarding.

---

# Chapter IV — How To Scale A Company

Scaling starts with the loop you already proved: build, sell, learn, and improve.

## Start With the Scaling Loop

The scaling loop:
1. Build — ship product changes that solve real user problems
2. Sell — get the product in front of the right people
3. Observe — watch what users actually do
4. Support — help users when they get stuck
5. Learn — find the patterns behind the behavior
6. Iterate — improve the product, positioning, pricing, or onboarding

## Add Product Analytics

Recommended: **PostHog** — funnels, custom events, retention analysis, and session replay in one place.

Key events to track from the start:
- signed_up
- onboarding_completed
- core_action_completed
- trial_started
- checkout_completed
- subscription_upgraded
- teammate_invited
- support_ticket_opened

Don't track almost nothing or everything. Track outcomes, not just page views.

**Analytics types:**
- **Funnel** — sequence of steps; shows where people drop off. If 1,000 sign up and only 150 create a first project, the problem is activation, not traffic.
- **Custom events** — meaningful actions: project created, report generated, file uploaded, teammate invited, invoice sent.
- **Session replay** — recordings of how a user moves through your app. Analytics tells you where something broke; replay shows you why.
- **Retention** — whether users come back at the natural frequency of the problem you solve.

Analytics loop:
1. Find a drop-off or unusual pattern
2. Watch replays for that segment
3. Talk to a few affected users
4. Form a hypothesis
5. Ship a small change
6. Measure whether the metric improves

**Cofounder feature:** Can read your product analytics, suggest changes, and proactively improve your app. If conversion drops, Cofounder can identify the likely issue, propose a fix, open a PR, and deploy a preview environment.

## Add Customer Support

Recommended: **Fin by Intercom** — an AI support agent that answers inbound questions using your documentation, product context, and support procedures, then escalates what it can't resolve.

Fin can handle: password resets, billing updates, teammate invites, import failures, plan changes, basic troubleshooting.

Fin should escalate (not handle): refund disputes, security concerns, data loss, angry enterprise customers, bugs affecting many users.

**Knowledge base basics:**
- Getting started
- Core workflows
- Billing and plans
- Troubleshooting
- Account management
- Known limitations

**Decision trees** for most common and painful categories:
- Login problems
- Billing questions
- Import failures
- Permission issues
- Core workflow errors
- Cancellations
- Bugs that block users from getting value

Write docs in the language customers use, not the language your codebase uses.

## Understand Unit Economics

Core metrics:

**Churn** — rate at which customers leave.
`Revenue churn rate = lost recurring revenue during period / recurring revenue at start of period`

**Average customer lifetime**
`Average customer lifetime = 1 / churn rate`

**ARPU** — average revenue per user/customer.
`ARPU = total revenue / number of customers`

**LTV** — lifetime value.
`LTV = ARPU × average customer lifetime`
`Gross margin LTV = ARPU × gross margin × average customer lifetime`

**CAC** — customer acquisition cost.
`CAC = sales and marketing cost during period / new customers acquired during period`
(Early CAC is easy to understate — founder time often looks free.)

**LTV/CAC** — if LTV is lower than CAC, something is broken. You need to increase retention, raise pricing, improve margins, lower acquisition cost, or revisit your ICP.
`LTV/CAC = lifetime value / customer acquisition cost`

**Payback period** — how long it takes to earn back the money spent acquiring a customer. If CAC is $600 and gross profit is $100/month, payback is 6 months.

Growth can hide a broken business. If every new customer costs more to acquire than they are worth, you are buying revenue at a loss.

## Expand the Business

Two paths:

**Vertical expansion** — serve existing customers more deeply. Add products, services, workflows, or infrastructure that make your product more central to the customer. Works best when customers already trust you, adjacent pain is obvious, and the new product increases retention or ARPU.

**Horizontal expansion** — serve a broader set of customers. Take what you built and adapt it to adjacent segments, use cases, or markets. Works best when core technology applies to multiple customer types.

Before expanding, ask:
- Where is demand already showing up? (inbound requests, support tickets, sales conversations)
- Does this improve retention, ARPU, CAC, or payback?
- Will it strengthen the core product or distract from it?
- Can we test demand before building the full thing? (Sell it before you build it.)
- Does it meaningfully increase the total addressable market?

Fundraising may become relevant at this stage. It is a tool, not the goal. The goal is to build a durable business that creates value for customers.

## What Comes Next

Scaling is not a single milestone. It is a discipline.

Add analytics so you can see what users do. Add support so you can hear where they struggle. Understand unit economics so you know whether growth makes the business stronger or weaker. Then use that signal to build better product, sell to better customers, and expand with intention.

The company gets better when the loop gets better. Keep the loop moving.
