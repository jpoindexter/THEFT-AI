"use client";

// Cross-stitch sunflower legacy asset.
// Renders as × glyphs (not filled squares) to match the textile aesthetic.

const GRID = [
  "............................",
  "............................",
  ".........pppPp..............",
  "........PpppppPp............",
  ".......PpppppppPp...........",
  "......pppPcccccPpp..........",
  ".....ppPccccccccPpp.........",
  "....pPpcccccccccccPp........",
  "....ppccccccccccccpp........",
  "....pPcccccccccccccp........",
  "....ppcccccccccccccpp.......",
  "....pPccccccccccccPpp.......",
  "....ppccccccccccccPpp.......",
  ".....pPcccccccccPppP........",
  ".....ppPcccccccPpp..........",
  "......pppPpPPpppP...........",
  ".......pPpppppP.............",
  "..........s.................",
  "..........s.................",
  ".........lss................",
  "........llsLL...............",
  ".......lLLs..LL.............",
  "......lLLLs..LLLl...........",
  ".....lLLLls..LLLLll.........",
  "......lLLs....LLLLll........",
  ".......lLs.....LLLLl........",
  "........s.......LLLl........",
  "........s........LLl........",
  "........s.........Ll........",
  "........s..................",
  "........s..................",
  "........s..................",
  "........ss.................",
  ".......lLLLs...............",
  "......lLLLLLs..............",
  ".....lLLLLLLLLs............",
  ".....lLLLLLLLLLLs..........",
  ".......lLLLLLLLLLs.........",
  "..........llLLLLLLs........",
  "..............lllLLs.......",
];

const PALETTE: Record<string, string> = {
  p: "#c89a4d",
  P: "#e0b96a",
  c: "#5a3618",
  s: "#6b7d44",
  l: "#7c8d4d",
  L: "#9aaa5d",
};

export default function Sunflower({ size = 224 }: { size?: number }) {
  const cell = size / GRID[0].length;
  const cols = GRID[0].length;
  const rows = GRID.length;
  const w = cols * cell;
  const h = rows * cell;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="select-none"
      aria-hidden
    >
      {GRID.flatMap((line, y) =>
        line.split("").map((ch, x) => {
          const fill = PALETTE[ch];
          if (!fill) return null;
          const cx = x * cell + cell / 2;
          const cy = y * cell + cell / 2;
          const half = cell * 0.42;
          return (
            <g key={`${x}-${y}`}>
              <line x1={cx - half} y1={cy - half} x2={cx + half} y2={cy + half} stroke={fill} strokeWidth="1.1" strokeLinecap="round" />
              <line x1={cx + half} y1={cy - half} x2={cx - half} y2={cy + half} stroke={fill} strokeWidth="1.1" strokeLinecap="round" />
            </g>
          );
        }),
      )}
    </svg>
  );
}
