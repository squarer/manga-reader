/**
 * 從章節列表計算上一章/下一章 ID
 * 章節列表順序：最新 → 最舊（index 0 = 最新章節）
 */
export function computePrevNextCid(
  chapters: { id: string }[],
  currentCid: string
): { prevCid: string | null; nextCid: string | null } {
  const index = chapters.findIndex((ch) => ch.id === currentCid);

  if (index === -1) {
    return { prevCid: null, nextCid: null };
  }

  // index - 1 = 較新的章節 = nextCid
  // index + 1 = 較舊的章節 = prevCid
  const nextCid = index > 0 ? chapters[index - 1].id : null;
  const prevCid = index < chapters.length - 1 ? chapters[index + 1].id : null;

  return { prevCid, nextCid };
}
