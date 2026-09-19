import { useCallback, useEffect, useState } from "react";
import {
  normalizeViewMode,
  sanitizeSearchTerm,
} from "../domain/marvel.js";

const readUrlState = () => {
  const params = new URLSearchParams(window.location.search);
  const rawCharacterId = Number(params.get("character"));

  return {
    query: sanitizeSearchTerm(params.get("q") ?? ""),
    characterId:
      Number.isInteger(rawCharacterId) && rawCharacterId > 0
        ? rawCharacterId
        : null,
    view: normalizeViewMode(params.get("view")),
  };
};

export const useUrlState = () => {
  const [state, setState] = useState(readUrlState);

  useEffect(() => {
    const onPopState = () => setState(readUrlState());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const updateUrlState = useCallback((patch, { replace = false } = {}) => {
    const next = { ...readUrlState(), ...patch };
    const params = new URLSearchParams();

    if (next.query) params.set("q", sanitizeSearchTerm(next.query));
    if (next.characterId) params.set("character", String(next.characterId));
    if (next.view && next.view !== "explore") {
      params.set("view", normalizeViewMode(next.view));
    }

    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;

    window.history[replace ? "replaceState" : "pushState"]({}, "", nextUrl);
    setState(readUrlState());
  }, []);

  return [state, updateUrlState];
};
