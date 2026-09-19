import { useEffect, useState } from "react";
import { getCharacter, getCharacterComics } from "../api/marvelClient.js";

const emptyState = {
  requestId: null,
  character: null,
  comics: [],
  error: null,
};

export const useCharacterDetails = (characterId, { onLoaded } = {}) => {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    if (!characterId) return undefined;

    const controller = new AbortController();

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
          requestId: characterId,
          character,
          comics,
          error: null,
        });
        onLoaded?.(character);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({
          requestId: characterId,
          character: null,
          comics: [],
          error,
        });
      });

    return () => controller.abort();
  }, [characterId, onLoaded]);

  if (!characterId) {
    return {
      character: null,
      comics: [],
      loading: false,
      error: null,
    };
  }

  if (state.requestId !== characterId) {
    return {
      character: null,
      comics: [],
      loading: true,
      error: null,
    };
  }

  return {
    character: state.character,
    comics: state.comics,
    loading: false,
    error: state.error,
  };
};
