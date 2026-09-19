import { useCallback, useEffect, useRef, useState } from "react";
import {
  listIssues,
  searchIssues,
} from "../api/marvelMetadataClient.js";
import { ISSUE_PAGE_SIZE, uniqueById } from "../domain/reading.js";

const createState = (key) => ({
  key,
  items: [],
  total: 0,
  offset: 0,
  ended: false,
  loadingMore: false,
  error: null,
});

export const useIssueList = (query) => {
  const [attempt, setAttempt] = useState(0);
  const key = `${query}::${attempt}`;
  const [state, setState] = useState(() => createState(""));
  const loadMoreController = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    loadMoreController.current?.abort();

    const load = query
      ? searchIssues(query, { signal: controller.signal })
      : listIssues({ offset: 0, signal: controller.signal });

    load
      .then((result) => {
        setState({
          key,
          items: result.items,
          total: result.total,
          offset: result.items.length,
          ended: query ? true : !result.hasNext,
          loadingMore: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({
          ...createState(key),
          ended: Boolean(query),
          error,
        });
      });

    return () => controller.abort();
  }, [key, query]);

  useEffect(
    () => () => {
      loadMoreController.current?.abort();
    },
    [],
  );

  const current = state.key === key ? state : createState(key);

  const retryInitial = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const loadMore = useCallback(async () => {
    const initialError = current.error && current.items.length === 0;

    if (query || current.loadingMore || current.ended || initialError) return;

    loadMoreController.current?.abort();
    const controller = new AbortController();
    loadMoreController.current = controller;

    setState((existing) => ({
      ...(existing.key === key ? existing : createState(key)),
      loadingMore: true,
      error: null,
    }));

    try {
      const result = await listIssues({
        offset: current.offset,
        limit: ISSUE_PAGE_SIZE,
        signal: controller.signal,
      });

      setState((existing) => {
        const base = existing.key === key ? existing : createState(key);
        const items = uniqueById([...base.items, ...result.items]);

        return {
          ...base,
          items,
          total: result.total,
          offset: base.offset + result.items.length,
          ended: !result.hasNext,
          loadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      if (error?.name === "AbortError") return;
      setState((existing) => ({
        ...(existing.key === key ? existing : createState(key)),
        loadingMore: false,
        error,
      }));
    }
  }, [
    current.ended,
    current.error,
    current.items.length,
    current.loadingMore,
    current.offset,
    key,
    query,
  ]);

  return {
    ...current,
    loading: state.key !== key,
    loadMore,
    retryInitial,
  };
};
