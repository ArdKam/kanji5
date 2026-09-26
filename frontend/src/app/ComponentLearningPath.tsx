import { useEffect, useMemo, useState } from "react";
import { formatNumber, t, type Language } from "./i18n";
import { getComponentInfo, type KanjiCatalogItem } from "./engine";

export function ComponentLearningPath({
  character,
  components,
  catalog,
  language,
  onSelectKanji,
}: {
  character: string;
  components: string[];
  catalog: KanjiCatalogItem[];
  language: Language;
  onSelectKanji: (item: KanjiCatalogItem) => void;
}) {
  const catalogByCharacter = useMemo(() => new Map(catalog.map(item => [item.character, item])), [catalog]);
  const directComponents = useMemo(() => components.slice(0, 8), [components]);
  const [graph, setGraph] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let active = true;
    const loadGraph = async () => {
      const nextFrontier = [...new Set(directComponents)];
      const loaded: Record<string, string[]> = {};
      const visited = new Set<string>();

      for (let depth = 0; depth < 3 && nextFrontier.length; depth += 1) {
        const batch = [...new Set(nextFrontier)].filter(component => !visited.has(component));
        if (!batch.length) break;
        batch.forEach(component => visited.add(component));
        const entries = await Promise.all(batch.map(async component => {
          try {
            const info = await getComponentInfo(component);
            return [component, info.available ? [...new Set(info.components)].slice(0, 5) : ([] as string[])] as const;
          } catch {
            return [component, [] as string[]] as const;
          }
        }));
        for (const [component, children] of entries) loaded[component] = children;
        nextFrontier.splice(0, nextFrontier.length, ...entries.flatMap(([, children]) => children));
      }

      if (active) setGraph(loaded);
    };
    setGraph({});
    void loadGraph();
    return () => { active = false; };
  }, [directComponents]);

  if (!directComponents.length) return null;

  const renderNode = (component: string, depth: number, path: Set<string>) => {
    if (depth > 2 || path.has(component)) return null;
    const item = catalogByCharacter.get(component);
    const mastery = item ? Math.round(Math.max(0, Math.min(1, Number(item.mastery) || 0)) * 100) : null;
    const children = (graph[component] ?? []).filter(child => child !== component);
    const nextPath = new Set(path);
    nextPath.add(component);

    return (
      <div className={`component-learning-path-node depth-${depth}`} key={component + "-" + depth}>
        <div className="component-learning-path-item">
          <div className="component-learning-path-main">
            {item ? (
              <button
                className="component-learning-path-kanji"
                type="button"
                lang="ja"
                onClick={() => onSelectKanji(item)}
                title={t("lookupKanji", language)}
              >
                {component}
              </button>
            ) : (
              <span className="component-learning-path-kanji is-static" lang="ja">{component}</span>
            )}
            <div className="component-learning-path-copy">
              <strong>{item ? (language === "fa" ? "کانجیِ جویو" : "Jōyō kanji") : (language === "fa" ? "جزء دیداری" : "Visual component")}</strong>
              {children.length ? <span lang="ja">{children.join(" + ")}</span> : <span>{t("componentLearningPathLeaf", language)}</span>}
            </div>
          </div>
          {mastery !== null ? (
            <span className="component-learning-path-mastery">{t("masteryShort", language)} {formatNumber(mastery, language)}%</span>
          ) : (
            <span className="component-learning-path-mastery is-unavailable">{t("notInCatalog", language)}</span>
          )}
        </div>
        {children.length ? (
          <div className="component-learning-path-children" role="list">
            {children.map(child => renderNode(child, depth + 1, nextPath))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section className="component-learning-path" aria-label={language === "fa" ? "نقشهٔ یادگیری اجزای کانجی" : "Kanji component learning graph"}>
      <div className="component-learning-path-header">
        <div>
          <h3>{t("componentLearningPath", language)}</h3>
          <p>{t("componentLearningPathHint", language)}</p>
        </div>
        <span className="component-learning-path-root" lang="ja">{character}</span>
      </div>
      <div className="component-learning-path-list" role="list">
        {directComponents.map(component => renderNode(component, 0, new Set<string>()))}
      </div>
    </section>
  );
}
