import { useEffect, useMemo, useState } from "react";
import { getCharacter } from "../api/marvelClient.js";
import { COLLECTION_LIMIT } from "../domain/marvel.js";

const emptyState = {
  key: "",
  items: [],
  error: null,
};

export const useCharacterCollection = (ids) => {
  const boundedIds = useMemo(
    () => ids.slice(0, COLLECTION_LIMIT),
    [ids],
  );
  const key = boundedIds.join(",");
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    if (!key) return undefined;

    const controller = new AbortController();

    Promise.allSettled(
      boundedIds.map((id) =>
        getCharacter(id, { signal: controller.signal }),
      ),
    ).then((results) => {
      if (controller.signal.aborted) return;

      const items = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failedCount = results.length - items.length;

      setState({
        key,
        items,
        error:
          items.length === 0 && failedCount > 0
            ? new Error("Saved character data could not be loaded.")
            : null,
      });
    });

    return () => controller.abort();
  }, [boundedIds, key]);

  if (!key) {
    return { items: [], loading: false, error: null };
  }

  if (state.key !== key) {
    return { items: [], loading: true, error: null };
  }

  return {
    items: state.items,
    loading: false,
    error: state.error,
  };
};
