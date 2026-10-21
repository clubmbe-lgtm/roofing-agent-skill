# Takeoff ratios

The figures `scripts/takeoff.mjs` uses to turn a signed roofing job into a
material order. They are common trade figures for asphalt roofing; the
coverage printed on the manufacturer's wrapper wins when it differs.

| Material | Ratio | Order |
| --- | --- | --- |
| Architectural shingles | 3 bundles per square (100 sq ft) | squares x 3, plus waste, rounded up |
| Synthetic underlayment | one roll covers 10 squares | squares plus waste, divided by 10, rounded up |
| Skylight flashing kit | one kit per skylight | one per skylight |
| Ridge vent | sections of 4 linear feet | ridge length divided by 4, rounded up |

Waste: 10 % on shingles and underlayment, for cuts, starter rows and hips.
A roof with many valleys or dormers may need 15 %: pass `"wastePercent": 15`.

Nothing here is a price. The supplier prices the order.
