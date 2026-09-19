import { useCallback, useEffect, useRef, useState } from "react";
import { listCharacters } from "../api/marvelClient.js";
import { CHARACTER_PAGE_SIZE, uniqueById } from "../domain/marvel.js";

const createState = (query) => ({
  query,
  items: [],
  loadingMore: false,
  error: null,
  offset: 0,
  ended: false,
});

export const useCharacterList = (query) => {
  const [state, setState] = useState(() => createState(null));
  const loadMoreController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    loadMoreController.current?.abort();

    listCharacters({ query, offset: 0, signal: controller.signal })
      .then((items) => {
        setState({
          query,
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
          ...createState(query),
          error,
        });
      });

    return () => controller.abort();
  }, [query]);

  useEffect(
    () => () => {
      loadMoreController.current?.abort();
    },
    [],
  );

  const current =
    state.query === query
      ? state
      : {
          ...createState(query),
          loadingMore: false,
        };

  const loadMore = useCallback(async () => {
    if (current.loadingMore || current.ended) return;

    loadMoreController.current?.abort();
    const controller = new AbortController();
    loadMoreController.current = controller;

    setState((existing) => ({
      ...(existing.query === query ? existing : createState(query)),
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
        const base = existing.query === query ? existing : createState(query);
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
        ...(existing.query === query ? existing : createState(query)),
        loadingMore: false,
        error,
      }));
    }
  }, [current.ended, current.loadingMore, current.offset, query]);

  return {
    ...current,
    loading: state.query !== query,
    loadMore,
  };
};
