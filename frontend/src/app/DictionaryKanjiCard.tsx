  useEffect(() => {
    setActiveSection("overview");
  }, [item.character]);

  useEffect(() => {
    if (!navigationDirection) return;
    const timer = window.setTimeout(() => setNavigationDirection(null), 320);
    return () => window.clearTimeout(timer);
  }, [item.character, navigationDirection]);


  const navigateKanji = (direction: "next" | "previous") => {
    const index = navItems.findIndex(candidate => candidate.character === item.character);
    if (index < 0) return;
    const nextIndex = direction === "next" ? index + 1 : index - 1;
    const nextItem = navItems[nextIndex];
    if (!nextItem) return;
    setNavigationDirection(direction);
    onSelectKanji(nextItem);
  };

  const handleCardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    if ((event.target as HTMLElement).closest("button, input, textarea, select, a")) return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleCardPointerCancel = () => {
    pointerStartRef.current = null;