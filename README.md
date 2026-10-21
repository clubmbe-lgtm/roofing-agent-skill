# Roofing Agent Skill

[![tests](https://github.com/clubmbe-lgtm/roofing-agent-skill/actions/workflows/test.yml/badge.svg)](https://github.com/clubmbe-lgtm/roofing-agent-skill/actions/workflows/test.yml)

A roofer's know-how, packaged as an [Agent Skill](https://agentskills.io): what to ask on a roof before
quoting, and how much material to order once a job is signed.

It is the skill Margo uses. Margo is the office manager we built for roofers on Alexa+ (ESTIBLOCK, Build, Ship,
Shape 2026). When a roofing job is signed, she reads the quote, runs the takeoff below and leaves the supplier
order in the roofer's app, where nothing goes out until they tap. The rest of ESTIBLOCK is not open source; this
part is, because any assistant that helps a roofer needs the same arithmetic.

## What's inside

```
roofing/
  SKILL.md                      when to use it, the questions before a quote, the steps to a supplier order
  references/site-checklist.md  nine things to know before quoting, most important first
  references/takeoff-ratios.md  the trade ratios behind the order
  scripts/takeoff.mjs           squares, skylights and ridge length in, quantities out
```

## The takeoff script

Node 18 or later, no dependencies. It reads one JSON argument and prints one JSON object: no file, no network, no
account, no prices (the supplier gives those).

```sh
node roofing/scripts/takeoff.mjs '{"squares":8,"skylights":2,"ridgeFeet":10}'
```

```json
{"basis":{"squares":8,"skylights":2,"ridgeFeet":10,"wastePercent":10},
 "items":[{"description":"Architectural shingles","quantity":27,"unit":"bundles"},
          {"description":"Synthetic underlayment, 10-square roll","quantity":1,"unit":"roll"},
          {"description":"Skylight flashing kit","quantity":2,"unit":"kits"},
          {"description":"Ridge vent, 4 ft section","quantity":3,"unit":"pieces"}],
 "summary":"8 sq → 27 bundles · 1 roll · 2 kits · 3 pieces"}
```

A square is 100 sq ft of roof. 3 bundles per square, a 10-square underlayment roll, one flashing kit per skylight,
ridge vent in 4 ft sections, 10 % waste on shingles and underlayment (`"wastePercent": 15` for a roof with many
valleys). Every quantity is rounded up.

| Field | Value |
| --- | --- |
| `squares` | required, more than 0 |
| `skylights` | optional, 0 by default |
| `ridgeFeet` | optional, linear feet, 0 by default |
| `wastePercent` | optional, 0 to 50, 10 by default |

Values are numbers, or numbers written as text. Anything else is refused with a reason on stderr and exit code 1,
and so is an unknown field: a misspelled `ridgeFeets` would otherwise leave the ridge vent off the order.

## Use it

### Claude Code

Copy `roofing/` to `.claude/skills/roofing/` in your project (or `~/.claude/skills/roofing/` for all of them).
Ask "a signed job covers 8 squares, 2 skylights and 10 feet of ridge, what do I order?": Claude loads the skill,
runs the script and answers 27 bundles, 1 roll, 2 kits and 3 ridge sections. Allow it to run `node` for the script.

### Strands Agents (TypeScript)

```ts
import { Agent } from '@strands-agents/sdk';
import { AgentSkills, Skill } from '@strands-agents/sdk/vended-plugins/skills';

const roofing = Skill.fromFile('./roofing', { strict: true });
const agent = new Agent({ model, tools, plugins: [new AgentSkills({ skills: [roofing], strict: true })] });
```

Tested with `@strands-agents/sdk` 1.19.0. The plugin gives the agent the skill's instructions; running
`scripts/takeoff.mjs` needs a tool of yours. Margo runs skill scripts with Node in permission mode: read-only
access to the `scripts/` folder, no writes, no child processes, an empty environment, 5 seconds at most.

### With your own back office

The `allowed-tools` line of `SKILL.md` names the tools of the ESTIBLOCK MCP server (`list_signed_jobs`,
`get_quote`, `find_supplier`, `prepare_supplier_order`…). Rename them to yours. Without them the questions, the
ratios and the script still work: the agent answers with the quantities and leaves the order to you.

## Tests

```sh
npm test
```

Node's own test runner, nothing to install. The workflow runs it on Node 18, 20, 22 and 24.

## License

MIT, see [LICENSE](LICENSE).
