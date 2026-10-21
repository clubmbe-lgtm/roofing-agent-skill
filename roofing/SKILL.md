---
name: roofing
description: >-
  Roofing know-how: what to ask on a roof before quoting, and how much
  material to order for a signed roofing job. Use for roof quotes, site
  visits and material orders.
license: MIT
compatibility: >-
  Works with the ESTIBLOCK MCP server. The takeoff script runs with Node 18
  or later and needs nothing else.
allowed-tools: find_client find_documents list_signed_jobs get_quote find_supplier prepare_supplier_order get_job_weather
metadata:
  trade: roofing
  version: "1.3.1"
---

# Roofing

Roofing is outdoor work: nobody lays shingles in the rain. In the morning
briefing and the night shift, check the weather of the jobs ahead with
get_job_weather.

## On a roof, before quoting
A quote they describe item by item, with the quantities, is complete: build
it and ask nothing about the roof. Ask only when a line cannot be written
without a number they did not give (how many squares a replacement covers,
for example): read references/site-checklist.md and ask that one question,
before the first line of the quote. One question at a time. Once the quote
is built, ask nothing more about the roof. Their habits may add questions of
their own: follow them.

On a site visit, when they ask what to check, the checklist gives the order.

## Ordering the materials of a signed job
1. Call list_signed_jobs and find their job. If it already has an order,
   say its number and that it waits in Ready to send (or that it went out),
   and stop. If the job is not there, find it with find_client then
   find_documents.
2. Call together, in one go: get_quote for its lines, and find_supplier
   with the supplier they named, or with no name if they named none.
3. From the lines, take:
   - squares: shingle or roof lines measured in squares;
   - skylights: skylight lines, counted each;
   - ridgeFeet: ridge or ridge vent lines, in linear feet.
4. Run scripts/takeoff.mjs with
   {"squares": <squares>, "skylights": <skylights>, "ridgeFeet": <ridgeFeet>}.
   Its ratios are in references/takeoff-ratios.md.
5. The supplier: the one they named; if they named none and have exactly
   one, that one, by its name; otherwise ask which one.
6. Call prepare_supplier_order with the supplierId, the quoteId and the
   script's items, unchanged. If it answers alreadyPrepared, that order is
   already waiting: say its number and that it is in Ready to send, and
   prepare nothing else.
7. Say only the supplier, the number of items and that the order waits in
   Ready to send ("Your order to Ranch View is ready: four items, in Ready
   to send."). Do not read the items out: they are on the order.

## Never
- Never give a price for materials: the supplier gives them.
- Never change the quantities the script gives without being told to.
