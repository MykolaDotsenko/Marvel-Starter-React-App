import { useEffect, useState } from "react";
import { getCharacter, getCharacterComics } from "../api/marvelClient.js";

const emptyState = {
  character: null,
  comics: [],
  loading: false,
  error: null,
};

export const useCharacterDetails = (characterId) => {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    if (!characterId) {
      setState(emptyState);
      return undefined;
    }

    const controller = new AbortController();
    setState({ ...emptyState, loading: true });

    Promise.all([
      getCharacter(characterId, { signal: controller.signal }),
      getCharacterComics(characterId, { signal: controller.signal }).catch(
        (error) => {
          if (error?.name === "AbortError") throw error;
          return [];
        },
      ),
    ])
      .then(([character, comics]) => {
        setState({
          character,
          comics,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({
          character: null,
          comics: [],
          loading: false,
          error,
        });
      });

    return () => controller.abort();
  }, [characterId]);

  return state;
};
