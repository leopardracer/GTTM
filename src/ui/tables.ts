import Table from "cli-table3";

export function plainTable(rows: [string, string][]): string {
  const t = new Table({
    chars: {
      top: "", "top-mid": "", "top-left": "", "top-right": "",
      bottom: "", "bottom-mid": "", "bottom-left": "", "bottom-right": "",
      left: "", "left-mid": "", mid: "", "mid-mid": "",
      right: "", "right-mid": "", middle: " ",
    },
    style: { "padding-left": 0, "padding-right": 2 },
  });
  for (const row of rows) t.push(row);
  return t.toString();
}

export function eventTable(rows: { time: string; type: string; detail: string }[]): string {
  const t = new Table({
    head: ["TIME", "EVENT", "DETAIL"],
    style: { head: ["gray"], "padding-left": 0, "padding-right": 2 },
    chars: {
      top: "", "top-mid": "", "top-left": "", "top-right": "",
      bottom: "", "bottom-mid": "", "bottom-left": "", "bottom-right": "",
      left: "", "left-mid": "", mid: "", "mid-mid": "",
      right: "", "right-mid": "", middle: " ",
    },
  });
  for (const r of rows) t.push([r.time, r.type, r.detail]);
  return t.toString();
}
