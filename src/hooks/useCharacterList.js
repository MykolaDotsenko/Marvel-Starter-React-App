import { useCallback, useEffect, useRef, useState } from "react";
import { listCharacters } from "../api/marvelClient.js";
import { CHARACTER_PAGE_SIZE, uniqueById } from "../domain/marvel.js";

const createState = (query, attempt = 0) => ({
  query,
  attempt,
  items: [],
  loadingMore: false,
  error: null,
  offset: 0,
  ended: false,
});

export const useCharacterList = (query) => {
  const [state, setState] = useState(() => createState(null));
  const [attempt, setAttempt] = useState(0);
  const loadMoreController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    loadMoreController.current?.abort();

    listCharacters({ query, offset: 0, signal: controller.signal })
      .then((items) => {
        setState({
          query,
          attempt,
          items,
          loadingMore: false,
          error: null,
          offset: items.length,
          ended: items.length < CHARACTER_PAGE_SIZE,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({
          ...createState(query, attempt),
          error,
        });
      });

    return () => controller.abort();
  }, [attempt, query]);

  useEffect(
    () => () => {
      loadMoreController.current?.abort();
    },
    [],
  );

  const current =
    state.query === query && state.attempt === attempt
      ? state
      : createState(query, attempt);

  const retryInitial = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const loadMore = useCallback(async () => {
    const hasInitialError = current.error && current.items.length === 0;
    if (current.loadingMore || current.ended || hasInitialError) return;

    loadMoreController.current?.abort();
    const controller = new AbortController();
    loadMoreController.current = controller;

    setState((existing) => ({
      ...(existing.query === query && existing.attempt === attempt
        ? existing
        : createState(query, attempt)),
      loadingMore: true,
      error: null,
    }));

    try {
      const nextItems = await listCharacters({
        query,
        offset: current.offset,
        signal: controller.signal,
      });

      setState((existing) => {
        const base =
          existing.query === query && existing.attempt === attempt
            ? existing
            : createState(query, attempt);

        return {
          ...base,
          items: uniqueById([...base.items, ...nextItems]),
          loadingMore: false,
          error: null,
          offset: base.offset + nextItems.length,
          ended: nextItems.length < CHARACTER_PAGE_SIZE,
        };
      });
    } catch (error) {
      if (error?.name === "AbortError") return;
      setState((existing) => ({
        ...(existing.query === query && existing.attempt === attempt
          ? existing
          : createState(query, attempt)),
        loadingMore: false,
        error,
      }));
    }
  }, [
    attempt,
    current.ended,
    current.error,
    current.items.length,
    current.loadingMore,
    current.offset,
    query,
  ]);

  return {
    ...current,
    loading: state.query !== query || state.attempt !== attempt,
    loadMore,
    retryInitial,
  };
};
