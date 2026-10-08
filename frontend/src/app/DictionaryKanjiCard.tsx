
  const navigateKanji = (direction: "next" | "previous") => {
    const index = navItems.findIndex(candidate => candidate.character === item.character);
    if (index < 0) return;
    const nextIndex = direction === "next" ? index + 1 : index - 1;
    const nextItem = navItems[nextIndex];
    if (!nextItem) return;
    setNavigationDirection(direction);
    onSelectKanji(nextItem);
  };
