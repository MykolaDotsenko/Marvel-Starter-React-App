import { useCallback, useEffect, useRef, useState } from "react";
import { listCharacters } from "../api/marvelClient.js";
import { CHARACTER_PAGE_SIZE, uniqueById } from "../domain/marvel.js";

const initialState = {
  items: [],
  loading: true,
  loadingMore: false,
  error: null,
  offset: 0,
  ended: false,
};

export const useCharacterList = (query) => {
  const [state, setState] = useState(initialState);
  const loadMoreController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    loadMoreController.current?.abort();

    setState(initialState);

    listCharacters({ query, offset: 0, signal: controller.signal })
      .then((items) => {
        setState({
          items,
          loading: false,
          loadingMore: false,
          error: null,
          offset: items.length,
          ended: items.length < CHARACTER_PAGE_SIZE,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState((current) => ({
          ...current,
          loading: false,
          error,
        }));
      });

    return () => controller.abort();
  }, [query]);

  useEffect(
    () => () => {
      loadMoreController.current?.abort();
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (state.loading || state.loadingMore || state.ended) return;

    loadMoreController.current?.abort();
    const controller = new AbortController();
    loadMoreController.current = controller;
    setState((current) => ({ ...current, loadingMore: true, error: null }));

    try {
      const nextItems = await listCharacters({
        query,
        offset: state.offset,
        signal: controller.signal,
      });

      setState((current) => ({
        ...current,
        items: uniqueById([...current.items, ...nextItems]),
        loadingMore: false,
        offset: current.offset + nextItems.length,
        ended: nextItems.length < CHARACTER_PAGE_SIZE,
      }));
    } catch (error) {
      if (error?.name === "AbortError") return;
      setState((current) => ({
        ...current,
        loadingMore: false,
        error,
      }));
    }
  }, [query, state.ended, state.loading, state.loadingMore, state.offset]);

  return { ...state, loadMore };
};
